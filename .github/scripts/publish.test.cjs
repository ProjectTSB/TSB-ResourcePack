const assert = require('node:assert/strict');
const { test } = require('node:test');
const { assetName, publish } = require('./publish.cjs');

function fixture(branch = 'feat/example', eventName = 'workflow_run') {
  const state = {
    heads: { main: 'a'.repeat(40), [branch]: 'b'.repeat(40) },
    release: { id: 1 },
    assets: [{ id: 1, name: 'resources.zip' }, { id: 2, name: 'manual.zip' }],
    calls: [],
  };
  const missing = () => { throw Object.assign(new Error('Not found'), { status: 404 }); };
  const record = (method) => async (args) => {
    state.calls.push({ method, ...args });
    return { data: { id: 1 } };
  };
  const github = {
    rest: {
      git: {
        getRef: async ({ ref }) => {
          const sha = state.heads[ref.slice('heads/'.length)];
          return sha ? { data: { object: { sha } } } : missing();
        },
        updateRef: record('updateRef'),
      },
      repos: {
        getReleaseByTag: async () => state.release ? { data: state.release } : missing(),
        listReleaseAssets: async () => ({ data: state.assets }),
        createRelease: record('createRelease'),
        deleteReleaseAsset: record('deleteReleaseAsset'),
        uploadReleaseAsset: record('uploadReleaseAsset'),
        updateRelease: record('updateRelease'),
      },
    },
    paginate: async (method, args) => (await method(args)).data,
  };
  const context = {
    repo: { owner: 'ProjectTSB', repo: 'TSB-ResourcePack' }, eventName,
    payload: {
      repository: { default_branch: 'main' }, ref_type: 'branch', ref: branch,
      inputs: { branch },
      workflow_run: {
        event: 'push', head_branch: branch, head_sha: 'c'.repeat(40), conclusion: 'success',
        head_repository: { full_name: 'ProjectTSB/TSB-ResourcePack' },
      },
    },
  };
  const archive = async (sha) => {
    state.calls.push({ method: 'archive', sha });
    return Buffer.from('zip');
  };
  const args = { github, context, core: { info() {} } };
  return { state, args, archive, run: () => publish(args, archive) };
}

test('branch filenames are stable, safe and distinct after sanitizing or truncating', () => {
  const branches = ['feat/a', 'feat-a', 'Feat/a', '日本語', '$(touch pwned)', 'a'.repeat(100), `${'a'.repeat(100)}b`];
  const names = branches.map((branch) => assetName(branch, 'main'));
  assert.equal(new Set(names).size, branches.length);
  for (const name of names) assert.match(name, /^resources-branch-[a-zA-Z0-9_-]+-[0-9a-f]{12}\.zip$/);
  assert.equal(assetName('main', 'main'), 'resources.zip');
  assert.equal(assetName('feat/a', 'main'), names[0]);
});

test('a push publishes only that branch using its current head after font generation', async () => {
  const f = fixture();
  await f.run();
  assert.deepEqual(f.state.calls.map((call) => call.method), ['archive', 'uploadReleaseAsset']);
  const upload = f.state.calls[1];
  assert.equal(upload.name, assetName('feat/example', 'main'));
  assert.equal(upload.label, `feat/example (${'b'.repeat(40)})`);
  assert.equal(f.state.calls[0].sha, 'b'.repeat(40));
});

test('an existing branch ZIP is replaced without deleting other assets', async () => {
  const f = fixture();
  f.state.assets.push({ id: 3, name: assetName('feat/example', 'main') });
  await f.run();
  assert.deepEqual(f.state.calls.map((call) => call.method), ['archive', 'deleteReleaseAsset', 'uploadReleaseAsset']);
  assert.equal(f.state.calls[1].asset_id, 3);
});

test('an unchanged uploaded ZIP is retained', async () => {
  const f = fixture();
  f.state.assets.push({ id: 3, name: assetName('feat/example', 'main'), label: `feat/example (${'b'.repeat(40)})`, state: 'uploaded' });
  await f.run();
  assert.deepEqual(f.state.calls, []);
});

test('main keeps resources.zip and advances dev without recreating the release', async () => {
  const f = fixture('main');
  await f.run();
  assert.deepEqual(f.state.calls.map((call) => call.method), ['archive', 'deleteReleaseAsset', 'uploadReleaseAsset', 'updateRef', 'updateRelease']);
  assert.equal(f.state.calls[1].asset_id, 1);
  assert.equal(f.state.calls[2].name, 'resources.zip');
  assert.equal(f.state.calls[2].label, '');
  assert.equal(f.state.calls[3].ref, 'tags/dev');
});

test('main republishes an existing unlabeled ZIP on a new push', async () => {
  const f = fixture('main');
  f.state.assets[0].label = '';
  f.state.assets[0].state = 'uploaded';
  await f.run();
  assert.equal(f.state.calls[0].method, 'archive');
  assert.equal(f.state.calls[2].name, 'resources.zip');
  assert.equal(f.state.calls[2].label, '');
});

for (const eventName of ['delete', 'workflow_run', 'workflow_dispatch']) {
  test(`${eventName}: a deleted branch removes only its own ZIP`, async () => {
    const f = fixture('feat/example', eventName);
    delete f.state.heads['feat/example'];
    f.state.assets.push({ id: 3, name: assetName('feat/example', 'main') });
    await f.run();
    assert.deepEqual(f.state.calls.map((call) => [call.method, call.asset_id]), [['deleteReleaseAsset', 3]]);
  });
}

test('deleting a branch that never published is a no-op', async () => {
  const f = fixture('feat/example', 'delete');
  delete f.state.heads['feat/example'];
  f.state.release = null;
  await f.run();
  assert.deepEqual(f.state.calls, []);
});

test('a delayed delete does not remove a recreated branch ZIP', async () => {
  const f = fixture('feat/example', 'delete');
  f.state.assets.push({ id: 3, name: assetName('feat/example', 'main') });
  await f.run();
  assert.deepEqual(f.state.calls, []);
});

for (const newHead of [undefined, 'd'.repeat(40)]) {
  test(`a branch changed during archiving is not published: ${newHead ?? 'deleted'}`, async () => {
    const f = fixture();
    f.state.assets.push({ id: 3, name: assetName('feat/example', 'main') });
    await publish(f.args, async () => {
      f.state.heads['feat/example'] = newHead;
      return Buffer.from('zip');
    });
    assert.deepEqual(f.state.calls.map((call) => call.method), newHead ? [] : ['deleteReleaseAsset']);
  });
}

test('an archive failure leaves the previous ZIP untouched', async () => {
  const f = fixture();
  f.state.assets.push({ id: 3, name: assetName('feat/example', 'main') });
  await assert.rejects(publish(f.args, async () => { throw new Error('Missing pack.mcmeta'); }), /Missing pack.mcmeta/);
  assert.deepEqual(f.state.calls, []);
});

test('API failures are not treated as branch deletion', async () => {
  const f = fixture();
  f.args.github.rest.git.getRef = async () => { throw Object.assign(new Error('Forbidden'), { status: 403 }); };
  await assert.rejects(f.run(), /Forbidden/);
  assert.deepEqual(f.state.calls, []);
});

test('a missing dev release is created against main, even for a feature branch', async () => {
  const f = fixture();
  f.state.release = null;
  await f.run();
  assert.deepEqual(f.state.calls.map((call) => call.method), ['archive', 'createRelease', 'uploadReleaseAsset']);
  assert.equal(f.state.calls[1].target_commitish, 'a'.repeat(40));
  assert.equal(f.state.calls[1].prerelease, true);
});

test('failed legacy font workflows can still publish the checked-in pack', async () => {
  const f = fixture();
  f.args.context.payload.workflow_run.conclusion = 'failure';
  await f.run();
  assert.equal(f.state.calls.at(-1).method, 'uploadReleaseAsset');
});

for (const kind of ['fork', 'pull_request', 'tag']) {
  test(`${kind} events are ignored`, async () => {
    const f = fixture();
    if (kind === 'fork') f.args.context.payload.workflow_run.head_repository.full_name = 'someone/fork';
    if (kind === 'pull_request') f.args.context.payload.workflow_run.event = kind;
    if (kind === 'tag') {
      f.args.context.eventName = 'delete';
      f.args.context.payload.ref_type = kind;
    }
    await f.run();
    assert.deepEqual(f.state.calls, []);
  });
}

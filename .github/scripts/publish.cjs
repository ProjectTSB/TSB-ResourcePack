const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const RELEASE_TAG = 'dev';

function assetName(branch, defaultBranch) {
  if (branch === defaultBranch) return 'resources.zip';
  const slug = branch.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  const hash = createHash('sha256').update(branch).digest('hex').slice(0, 12);
  return `resources-branch-${slug}-${hash}.zip`;
}

function buildArchive(sha) {
  const directory = mkdtempSync(join(tmpdir(), 'resourcepack-'));
  try {
    // 対象ブランチのコードを実行せず、指定コミットの配布ファイルだけを取り出す
    execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', sha], { stdio: 'inherit' });
    const output = join(directory, 'resources.zip');
    execFileSync('git', [
      'archive', '--format=zip', `--output=${output}`, sha,
      'assets', 'pack.mcmeta', 'pack.png',
    ], { stdio: 'inherit' });
    return readFileSync(output);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function optional(request) {
  try {
    return (await request()).data;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function publish({ github, context, core }, archive = buildArchive) {
  const { payload, eventName, repo } = context;
  const defaultBranch = payload.repository.default_branch;
  let branch;
  if (eventName === 'workflow_run') {
    const run = payload.workflow_run;
    if (run.event !== 'push' || run.head_repository?.full_name !== `${repo.owner}/${repo.repo}`) return;
    branch = run.head_branch;
  } else if (eventName === 'delete') {
    if (payload.ref_type !== 'branch') return;
    branch = payload.ref;
  } else if (eventName === 'workflow_dispatch') {
    branch = payload.inputs.branch;
  } else {
    throw new Error(`Unsupported event: ${eventName}`);
  }
  if (!branch) throw new Error('Missing branch name');

  const head = async (name) => {
    const ref = await optional(() => github.rest.git.getRef({ ...repo, ref: `heads/${name}` }));
    return ref?.object.sha;
  };
  const sha = await head(branch);
  // 同名ブランチが再作成された場合、遅れて届いた削除イベントでは削除しない
  if (eventName === 'delete' && sha) return;

  const name = assetName(branch, defaultBranch);
  let release = await optional(() => github.rest.repos.getReleaseByTag({ ...repo, tag: RELEASE_TAG }));
  if (release?.immutable) throw new Error('The dev release must allow asset updates');
  const assets = release
    ? await github.paginate(github.rest.repos.listReleaseAssets, { ...repo, release_id: release.id, per_page: 100 })
    : [];
  const existing = assets.find((asset) => asset.name === name);
  const remove = async () => {
    if (existing) {
      await github.rest.repos.deleteReleaseAsset({ ...repo, asset_id: existing.id });
      core.info(`Removed ${name}`);
    }
  };
  if (!sha) {
    await remove();
    return;
  }

  const label = branch === defaultBranch ? '' : `${branch} (${sha})`;
  if (branch === defaultBranch || existing?.label !== label || existing.state !== 'uploaded') {
    const data = await archive(sha);
    // ZIP 作成中の更新・削除を確認し、古い内容の公開を避ける
    const current = await head(branch);
    if (!current) {
      await remove();
      return;
    }
    if (current !== sha) {
      core.info(`Skipped ${branch}: updated while building; the next run will publish it`);
      return;
    }
    if (!release) {
      const mainSha = branch === defaultBranch ? sha : await head(defaultBranch);
      if (!mainSha) throw new Error('Default branch is missing');
      release = (await github.rest.repos.createRelease({
        ...repo, tag_name: RELEASE_TAG, target_commitish: mainSha,
        name: RELEASE_TAG, prerelease: true,
        body: 'Development resource packs. resources.zip is the default branch; other asset labels identify their branch and commit.',
      })).data;
    }
    await remove();
    await github.rest.repos.uploadReleaseAsset({
      ...repo, release_id: release.id, name, label, data,
      headers: { 'content-type': 'application/zip', 'content-length': data.length },
    });
    core.info(`Published ${name} from ${branch} at ${sha}`);
  }

  if (branch === defaultBranch) {
    await github.rest.git.updateRef({ ...repo, ref: `tags/${RELEASE_TAG}`, sha, force: true });
    await github.rest.repos.updateRelease({
      ...repo, release_id: release.id,
      body: 'Development resource packs. resources.zip is the default branch; other asset labels identify their branch and commit.',
    });
  }
}

module.exports = { assetName, buildArchive, publish };

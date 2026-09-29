const fs = require('fs');
const path = require('path');

const whiteResult = {
  walking_glb_url: 'https://assets.meshy.ai/ac0ca5d4-3b33-4a14-83ec-6191a397d1d5/tasks/01a0eb66-1fd7-7509-ad2d-f03c990492df/output/Animation_Walking_withSkin.glb?Expires=1790915042&Signature=HbZ2st837lNQcQOL2px~uJGvn3lZDrpQLYNRzmCc9~ZtvHHisWx7muII8ZkFkU4InxOUUoC9tls4xFQOMYtMGnrqhVWqKMaJ~UczJZ29U6zOl2qTVjHhLGgx-NtpuOkA2t7NGamN8RcnwVPGS-8n0PV3WnbsESqE3w~CEB1KOsRymMpZLcrvBQIURt8PIerqhsEjtHbvh6vDKjtNUH2IR6UcTDGrxu2pMp4PGq3PmVKe8AWwVgYkcn4ipUComHy7Dnzv5NGfasD9tXeqB9v7QEMKunO~id0pkat0FtrKupo-mmMVgdQfQuFJJw05I0m34MvBDp4f9RTKw5oOV-uutw__&Key-Pair-Id=K1VGYTHIYLM9UM',
  running_glb_url: 'https://assets.meshy.ai/ac0ca5d4-3b33-4a14-83ec-6191a397d1d5/tasks/01a0eb66-1fd7-7509-ad2d-f03c990492df/output/Animation_Running_withSkin.glb?Expires=1790915042&Signature=LeJGVSC5EP2wX2QxPqi9AqVPYL6hqA4mWcsEIb-e19oHuH-GHOQZL5CXaXBYl~bE6NyfyHPgovElRBRH0epMYCLnhQ5Xr0TZDTI78oHu0rRKyryAdFF8Lal-k4jFbEikJe0dPCC~UEusd6vJYoVO~7u6CAC-LGSRGtwSiCqVqFjNY~h4lkRTdaia2e9BX56b08JHur3TG7OuuIl-~t8iUrXej8wFK8Rb4A4iG1Nk7C4SjtSpH4s5rniA23ERRWiQ1e~iAmYVBXuaY8YkRK4E3IjfuOr9qP7B5suRUuX6FL2viqh5HUsO6PCDD0WpWU5h1c2uJvv5Nji0Z~A0vOBPUw__&Key-Pair-Id=K1VGYTHIYLM9UM',
  rigged_character_glb_url: 'https://assets.meshy.ai/ac0ca5d4-3b33-4a14-83ec-6191a397d1d5/tasks/01a0eb66-1fd7-7509-ad2d-f03c990492df/output/Character_output.glb?Expires=1790915042&Signature=hZqnL3Wz-lrsGDBhfJ5TQ9NxYLyTCHM844z9ka9YTvXf3e9E8AdlAk5-Y3ubud-pZSQ~Vco9qHp7vTGpAARgsJee25YEydESS33VYT~Oid5wYi3BqehX-lccB6CU-oSwWu7E7TXA-9L2vx3GEcQNyB96o-BQCbC1beyK41SgvU-TceOxyitXgoXE9x5uTyG~vugH3jZIx~1DVr~Df7tUf115iX13vxjDI3ZLZox2xK8ylUPx1MkTZLx4HV6X~XKIzV7Ap5dnoChWZLKTdzZctofDI3bqEXQhf72Y1pY-FTd097Y-dWom0-hn1~bi3deVVxT6qUtVx9bhmaKdx1jOCQ__&Key-Pair-Id=K1VGYTHIYLM9UM'
};

async function download(url, dest) {
  console.log('Downloading to:', dest);
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log('Saved:', dest, buf.length, 'bytes');
}

async function run() {
  const dir = path.join(__dirname, 'public', 'assets', 'models', 'meshy', 'white');
  await download(whiteResult.running_glb_url, path.join(dir, 'knight_run.glb'));
  await download(whiteResult.walking_glb_url, path.join(dir, 'knight_walk.glb'));
  await download(whiteResult.rigged_character_glb_url, path.join(dir, 'knight_rigged.glb'));
  await download(whiteResult.running_glb_url, path.join(dir, 'knight.glb'));
  console.log('White Knight all downloaded successfully!');
}
run().catch(console.error);

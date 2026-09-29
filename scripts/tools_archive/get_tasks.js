
const apiKey = 'msy_0JO6JEWcaDKiKhv3nvMDtVNPwuxTcLVH72Yr';
fetch('https://api.meshy.ai/openapi/v1/image-to-3d?limit=100', {
  headers: { 'Authorization': 'Bearer ' + apiKey }
})
.then(r => r.json())
.then(data => {
  data.forEach(t => console.log(t.id, t.name, t.status));
});


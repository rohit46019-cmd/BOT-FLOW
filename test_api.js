fetch('http://localhost:3000/api/stats', { headers: { 'x-owner-id': 'default' } })
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);

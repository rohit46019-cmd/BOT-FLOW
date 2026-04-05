const ids = [
  "699d09d87f9d74891751dbf4",
  "69a4f80be40857fb8d6abffd",
  "69ac629bc3beaea233b5a58f",
  "69ac645cc3beaea233b5a5a3",
  "69ac6aedc3beaea233b5a625"
];

for (const id of ids) {
  const timestamp = parseInt(id.substring(0, 8), 16);
  console.log(`${id}: ${new Date(timestamp * 1000).toISOString()}`);
}

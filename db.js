var db = openDatabase(
  'referrer_log',
  '',
  "A log of referrer data you leak to third parties on the web",
  64 * 1024 * 1024 // 64 megs
);

db.changeVersion('', '1', function(tx) {
  tx.executeSql(
    "CREATE TABLE requests (" +
    "  id INTEGER PRIMARY KEY AUTOINCREMENT," +
    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
    "  req_url TEXT," +
    "  req_domain TEXT," +
    "  req_root TEXT," +
    "  ref_url TEXT," +
    "  ref_domain TEXT," +
    "  ref_root TEXT" +
    ")"
  );
  ["req_domain", "req_root", "ref_domain", "ref_root"].forEach(function(idx) {
    tx.executeSql(
      "CREATE INDEX " + idx + "_idx ON requests (" + idx + ")"
    );
  });
});

function db_insert_request(req, ref) {
  db.transaction(function(tx) {
    tx.executeSql(
      "INSERT INTO requests (req_url, req_domain, req_root, ref_url, " +
        "ref_domain, ref_root) VALUES (?, ?, ?, ?, ?, ?)",
      [req.href, req.host, req.root, ref.href, ref.host, ref.root]
    );
  });
}

function db_reset() {
  db.transaction(function(tx) {
    tx.executeSql("DELETE FROM requests");
  });
}

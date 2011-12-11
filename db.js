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

function _db_rowize(callback, tx, rs) {
  var rows = [];
  for (var i = 0; i < rs.rows.length; i++) {
    rows.push(rs.rows.item(i));
  }
  callback(rows);
}

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

function db_get_trackers(callback) {
  db.transaction(function(tx) {
    tx.executeSql(
      "SELECT req_root, COUNT(*) as num FROM requests GROUP BY req_root ORDER BY num DESC LIMIT 50", [],
      _db_rowize.bind(null, callback));
  });
}

function db_get_by_tracker(tracker, callback) {
  db.transaction(function(tx) {
    // TODO: ref_domain instead of ref_root
    tx.executeSql(
      "SELECT ref_root, COUNT(*) as num FROM requests WHERE req_root = ? GROUP BY ref_root ORDER BY num DESC LIMIT 30", [tracker],
      _db_rowize.bind(null, callback));
  });
}

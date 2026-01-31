const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
  res.json({ service: 'react-petclinic-server' });
});

module.exports = router;

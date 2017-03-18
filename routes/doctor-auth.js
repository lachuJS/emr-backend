var
  express = require('express'),
  router = express.Router(),
  passport = require('passport');

router.post('/login',passport.authenticate('local'),(req, res) => {
  res.status(200);

  doctor = Object.assign({},req.user);
  delete doctor.id;

  res.json(doctor);
});
router.get('/logout',(req, res) => {
  req.logout();
  res.sendStatus(200);
});

module.exports = router;

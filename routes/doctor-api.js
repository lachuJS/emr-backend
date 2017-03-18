var
  express = require('express'),
  router = express.Router(),
  passport = require('passport');

var doctor = require('../bin/models/doctor');

var validate = require('../bin/validate');

router.get('/appointments', function(req, res, next) {
  if(req.user) { //sessions exist
    doctor.getAppointments(req.user.id,(err, appointments) => {
      if(err){
        next(err);
      }
      else{
        res.json(appointments);
      }
    });
  }
  else{ //not logged in
    let err = new Error('Unauthorized');
    err.status = 401;
    next(err);
  }
});
router.get('/patient-history/:patientId', function(req, res, next) {
  if(req.user) {
    let patientId = req.params.patientId;
    let doctorId = req.user.id;
    doctor.getPatientHistory(patientId,doctorId,(err,history) => {
      if(err){
        next(err);
      }
      else if (!history) { //
        let err = new Error('No permissions to access patient history');
        err.status = 403;
        next(err);
      }
      else{
        res.json(history);
      }
    });
  }
  else{
    let err = new Error('Unauthorized');
    err.status = 401;
    next(err);
  }
});
router.get('/patient-healthlogs/:aid', function(req, res, next) {
  if(req.user){
    let appointmentId = req.params.aid;
    let doctorId = req.user.id;
    doctor.getPatientHealthlogs(appointmentId, doctorId, (err, healthLogs) => {
      if(err){
        next(err);
      }
      else if (!healthLogs) {
        let err = new Error('Patient doesnt have an appoinment.');
        err.status = 403; //forbidden
        next(err);
      }
      else{
        res.json(healthLogs);
      }
    });
  }
  else{
    let err = new Error('Unauthorized');
    err.status = 401;
    next(err);
  }
});
router.post('/patient-healthlog', function(req, res, next) {
  if(req.user){
    let healthLog = req.body;

    //validations
    if(!validate.healthLog(healthLog)){
      err = new Error('health-log validation failed.');
      err.status = 400;
      return next(err);
    }

    doctor.postPatientHealthLog(healthLog,(err, healthLogId) => {
      if(err){
        next(err);
      }
      else{
        res.status(201);
        res.json({id:healthLogId});
      }
    });
  }
  else{
    let err = new Error('Unauthorized');
    err.status = 401;
    next(err);
  }
});

module.exports = router;

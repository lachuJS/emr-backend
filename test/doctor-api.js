var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var should = chai.should();
var passportStub = require('passport-stub');

var app = require('../app');
passportStub.install(app);

chai.use(chaiHttp);

describe('/doctor/api',() => {
let doctor,healthLog,requiredHealthLog,errHealthLog;

  before(() => {
    doctor = {
      id:2,
      name:'doctor_name',
      bio:'MBBS',
      email:'doctor@email.com',
      phone:9876543212,
      password:'default'
    }
    healthLog = {
      aid:2,
      examination: 'oriented',
      pr: null,
      bp:110,
      temp:99,
      rr:null,
      cvs:null,
      cns:null,
      rs:null,
      pa:null,
      le:'lorem ipsum',
      followUp: '2017-01-01',
      prescription: [1],
      chiefComplaints: [1],
      finalDiagnosis: [1]
    }
    requiredHealthLog = {
      aid:2,
      examination: 'concious',
      pr:null,
      bp:null,
      temp:null,
      rr:null,
      cvs:null,
      cns:null,
      rs:null,
      pa:null,
      le:null,
      followUp: null,
      prescription: [1],
      chiefComplaints: [1],
      finalDiagnosis: [1]
    }
    errHealthLog = {
      aid:2,
      examination: 'concious',
      pr:null,
      bp:null,
      temp:null,
      rr:null,
      cvs:null,
      cns:null,
      rs:null,
      pa:null,
      le:null,
      followUp: null,
      prescription: null,
      chiefComplaints: [1],
      finalDiagnosis: null
    }
  });

  describe('/appointments',() => {
      //specs
      it('should get all appointments of the doctor',(done) => {
        passportStub.login(doctor); //stub of passport deserialize strategy
        chai
          .request(app)
          .get('/doctor/api/appointments')
          .end((err,res) => {
            if(err) { done(err) }
            expect(res.body).to.be.a('array');
            done();
          });
      });
      it('should return error 401 unauthorized if not logged in',(done) => {
        passportStub.logout(app);
        chai
          .request(app)
          .get('/doctor/api/appointments')
          .end((err, res) => {
            expect(err).to.be.defined;
            err.should.have.status(401);
            done()
          });
      });

  });

  describe('/patient-history/:patientId',() => {
    //specs
    it('should get patient history with patient id',(done) => {
        passportStub.login(doctor);
        chai
          .request(app)
          .get('/doctor/api/patient-history/2')
          .end((err,res) => {
            if(err) { done(err) }
            res.should.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.all.keys('dm','htn','ba','thyroid','seizures','presenting_illness');
            expect(res.body.presenting_illness).to.be.a('array');
            done();
          });
    });
    it('should return error 401 unauthorized if not logged in',(done) => {
      passportStub.logout(app);
      chai
        .request(app)
        .get('/doctor/api/patient-history/2')
        .end((err, res) => {
          expect(err).to.be.defined;
          err.should.have.status(401);
          done();
        });
    });
    it('should return 403 forbidden if no pending appointments between doctor & patient',(done) => {
      passportStub.login(doctor);
      chai
        .request(app)
        .get('/doctor/api/patient-history/1')
        .end((err, res) => {
          expect(err).to.be.defined;
          err.should.have.status(403);
          done();
        })
    });
  });

  describe('/patient-healthlogs/:aid',() => {
    //specs
    it('should get patient healthlogs with aid',(done) => {
      passportStub.login(doctor);
      chai
        .request(app)
        .get('/doctor/api/patient-healthlogs/2')
        .end((err, res) => {
          if(err){ done(err) }
          res.should.have.status(200);
          expect(res.body).to.be.a('array');
          expect(res.body[0]).to.have.all.keys('examination','pr','bp','rr','temp','cvs','cns','rs','pa','le','followUp',
          'prescription','chiefComplaints','finalDiagnosis');
          expect(res.body[0].prescription).to.be.a('array');
          expect(res.body[0].chiefComplaints).to.be.a('array');
          expect(res.body[0].finalDiagnosis).to.be.a('array');
          done();
        });
    });
    it('should return error 401 unauthorized if not logged in',(done) => {
      passportStub.logout(app);
      chai
        .request(app)
        .get('/doctor/api/patient-healthlogs/2')
        .end((err, res) => {
          expect(err).to.be.defined;
          err.should.have.status(401);
          done();
        });
    });
    it('should respond forbidden error if aid doesnt exist with the doctor',(done) => {
      passportStub.login(doctor);
      chai
        .request(app)
        .get('/doctor/api/patient-healthlogs/1')
        .end((err, res) => {
          expect(err).to.be.defined;
          err.should.have.status(403);
          done();
        });
    });
  });

  describe('/patient/healthlog',() => {
    //specs
    it('should post patient healthlog and return id',(done) => {
      passportStub.login(doctor);
      chai
        .request(app)
        .post('/doctor/api/patient-healthlog')
        .send(healthLog)
        .end((err,res) => {
          if(err){ done(err) }
          res.should.have.status(201);
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.property('id');
          res.body.id.should.be.defined;
          done();
        });
    });
    it('should post patient healthlog minimal (only required fields)',(done) => {
      passportStub.login(doctor);
      chai
        .request(app)
        .post('/doctor/api/patient-healthlog')
        .send(requiredHealthLog)
        .end((err, res) => {
          if(err) { console.log(err) }
          res.should.have.status(201);
          expect(res.body).to.have.property('id');
          expect(res.body).to.be.a('object');
          res.body.id.should.be.defined;
          done();
        });
    });
    it('should respond 400 bad request error on missing property in healthLog',(done) => {
      passportStub.login(doctor);
      chai
        .request(app)
        .post('/doctor/api/patient-healthlog')
        .send(errHealthLog)
        .end((err, res) => {
          err.should.have.status(400);
          done();
        });
    });
    it('should return error 401 unauthorized if not logged in',(done) => {
      passportStub.logout(app);
      chai
        .request(app)
        .post('/doctor/api/patient-healthlog')
        .send(requiredHealthLog)
        .end((err, res) => {
          expect(err).to.be.defined;
          err.should.have.status(401);
          done();
        });
    });
  });

});

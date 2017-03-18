var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var should = chai.should();

var app = require('../app');

chai.use(chaiHttp);

describe('doctor auth',() => {

  before(() => {
    doctor = {
      username: 9789345678,
      password: 'default'
    }
  });

  describe('/doctor/auth/login',() => {
    it('should respond with set-cookie healder',(done) => {
      chai
        .request(app)
        .post('/doctor/auth/login')
        .set("X-Requested-With", "XMLHttpRequest") //ajax header
        .send(doctor)
        .end((err, res) => {
          if(err){ done(err) }
          else{
            expect(res).to.have.cookie('_healthiswealth_<3');
            res.should.have.status(200);
            expect(res.body).to.have.all.keys('name','bio');
            done();
          }
        });
    });
    it('should respond 401 unauthorized if failed',(done) => {
      chai
        .request(app)
        .post('/doctor/auth/login')
        .set("X-Requested-With", "XMLHttpRequest")
        .send({username:9876543212,password:'password'})
        .end((err,res) => {
          expect(err).to.be.defined;
          err.should.have.status(401);
          done();
        });
    });
  });

  describe('/doctor/auth/logout',(done) => {
    it('should set empty session cookie',(done) => {
      chai
        .request(app)
        .get('/doctor/auth/logout')
        .set("X-Requested-With","XMLHttpRequest")
        .end((err, res) => {
          if(err) { done(err) }
          expect(res).to.have.cookie('_healthiswealth_<3');
          done();
        });
    });
  });

});

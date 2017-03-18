var
  pool = require('../mysql-pool'),
  doctor = new Object();

  //auth
  //passport strategies
  doctor.findByPhone = (username, password, done) => {
    pool.query(`select id,name,bio from doctor where phone="${username}" and password="${password}"`,(err,rows) => {
      //mysql errors
      if(err){
        done(err);
      }
      //wrong creds
      if(rows.length == 0){
        done(null,false,{message:'invalid credentials'});
      }
      else{
        done(null,rows[0]);
      }
    });
  }
  doctor.findById = (id,done) => {
    pool.query(`select * from doctor where id="${id}"`,(err, rows) => {
      if(err){
        done(err);
      }
      if(rows.length == 0){
        done(null,false,{message:'invalid session.'});
      }
      else{
        console.log(rows[0]);
        done(null,rows[0]);
      }
    });
  }

//api
doctor.getAppointments = (id,done) => {
  pool.query(`select appointment.id as aid,patient.name,patient.id as hid,patient.gender,patient.dob,appointment.follow_up as followUp
    from appointment join patient on appointment.hid = patient.id where appointment.completed = false and appointment.did = ${id}`,(err, appointments) => {
    if(err){
      done(err);
    }
    done(null,appointments);
  });
}
doctor.getPatientHistory = (patientId,doctorId,done) => {
  //check if appointment exists with the patient first
  pool.getConnection((err, connection) => {
    if(err){ return done(err) }
    //check if pending appointment exists between doctor and patient
    connection.query(`select id from appointment where hid=${patientId} and did="${doctorId}" and completed=false`,(err,rows) => {
      if(err) { return done(err) }
      else if(rows.length == 0) { return done(null,false) }
      else{
        connection.query(`select patient.dm,patient.htn,patient.ba,patient.thyroid,patient.seizures,group_concat(diseases.name separator ',') as presenting_illness
        from patient join presenting_illness on patient.id = presenting_illness.hid join diseases on presenting_illness.illness= diseases.id
        where patient.id=${patientId} group by patient.id`,(err, history) => {
          if(err){
            return done(err);
          }
          connection.release();
          //can only be one row assocciated with a patient
          history[0].presenting_illness = history[0].presenting_illness.split(',');
          done(null,history[0]);
        });
      }
    });
  });
}
doctor.getPatientHealthlogs = (appointmentId, doctorId, done) => {
  //check if doctor is the owner of aid first
  pool.getConnection((err, connection) => {
    if(err){ return done(err) }
    connection.query(`select * from appointment where id=${appointmentId} and did=${doctorId}`,(err, rows) => {
      if(err){ return done(err) }
      else if(rows.length == 0){
        return done(null, false);
      }
      else{ //doctor owns the appointment
        pool.query(`SELECT healthlog.examination, healthlog.pr, healthlog.bp, healthlog.rr, healthlog.temp, healthlog.cvs,healthlog.cns,
          healthlog.rs, healthlog.pa, healthlog.le, healthlog.follow_up as followUp, healthlog.prescription,chief_complaints. chiefComplaints,
          Diagnosis. finalDiagnosis FROM(SELECT healthlog.*,GROUP_CONCAT(drugs.name SEPARATOR ',') as prescription
          FROM healthlog LEFT OUTER JOIN prescription ON (healthlog.id = prescription.healthlog_id)
          LEFT OUTER JOIN drugs ON (prescription.drug_id= drugs.id) GROUP BY healthlog.id) as healthlog,
          (SELECT healthlog.id,GROUP_CONCAT(diseases.name SEPARATOR ',') as finalDiagnosis FROM healthlog
          LEFT OUTER JOIN diagnosis ON (healthlog.id = diagnosis.healthlog_id) LEFT OUTER JOIN diseases ON (diagnosis.disease_id= diseases.id)
          GROUP BY healthlog.id) as Diagnosis,(SELECT healthlog.id,GROUP_CONCAT(symptom.name SEPARATOR ',') as chiefComplaints
          FROM healthlog LEFT OUTER JOIN chief_complaints ON (healthlog.id = chief_complaints.healthlog_id)
          LEFT OUTER JOIN symptom ON (chief_complaints.symptom_id= symptom.id) GROUP BY healthlog.id) as chief_complaints
          WHERE healthlog.id = Diagnosis.id and healthlog.id= chief_complaints.id and healthlog.aid="${appointmentId}" GROUP BY healthlog.id`,(err, healthLogs) => {
          if(err){
            return done(err);
          }
          healthLogs.map((healthLog) => {
            healthLog.prescription =  healthLog.prescription ? healthLog.prescription.split(',') : null;
            healthLog.chiefComplaints = healthLog.chiefComplaints ? healthLog.chiefComplaints.split(',') : null;
            healthLog.finalDiagnosis = healthLog.finalDiagnosis ? healthLog.finalDiagnosis.split(',') : null;
          });
          done(null,healthLogs);
        });
      }
    });
  });
}

doctor.postPatientHealthLog = (healthLog, done) => {
  pool.getConnection((err, connection) => {
    if(err){
      done(err);
    }
    else{
      healthLog.followUp = healthLog.followUp ? `"${healthLog.followUp}"` : null;
      connection.query(`insert into healthlog values(null,${healthLog.aid},"${healthLog.examination}",${healthLog.pr},
        ${healthLog.bp},${healthLog.rr},${healthLog.temp},${healthLog.cvs},${healthLog.cns},${healthLog.rs},${healthLog.pa},
        "${healthLog.le}",${healthLog.followUp})`,(err, result) => {
          if(err){
            done(err);
          }
          else{
            let healthLogId = result.insertId;

            let insertChiefComplaints = 'insert into chief_complaints values ';
            healthLog.chiefComplaints.map((symptomId) => {
              insertChiefComplaints += `(${healthLogId},${+symptomId}),`;
            });
            insertChiefComplaints = insertChiefComplaints.slice(0,-1);

            connection.query(insertChiefComplaints,(err,result) => {
              if(err){
                done(err);
              }
              else{
                let insertDiagnosis = 'insert into diagnosis values ';
                healthLog.finalDiagnosis.map((diseaseId) => {
                  insertDiagnosis += `(${healthLogId},${diseaseId}),`;
                });
                insertDiagnosis = insertDiagnosis.slice(0,-1);

                connection.query(insertDiagnosis,(err,result) => {
                  if(err){
                    done(err);
                  }
                  else{
                    let insertPrescription = 'insert into prescription values ';
                    healthLog.prescription.map((drugId) => {
                      insertPrescription += `(${healthLogId},${drugId}),`;
                    });
                    insertPrescription = insertPrescription.slice(0,-1);

                    connection.query(insertPrescription,(err,result) => {
                      err ? done(err) : done(null,healthLogId);
                      connection.release();
                    });
                  }
                });
              }
            });
          }
        });
      }
  });
}

module.exports = doctor;

validate = new Object();

validate.healthLog = (healthLog) => {
  //return false if healthLog is invalid
  //check all required fields is defined
  requiredProperties = ['examination','aid','chiefComplaints','prescription','finalDiagnosis'];
  for (var i = 0; i < requiredProperties.length; i++) {
    let property = healthLog[requiredProperties[i]];
    if(property == undefined || property == null){
      return false;
    }
  }
  return true;
}

module.exports = validate;

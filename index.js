const parse = require("csv-parse"); // csv parser
const fs = require("fs");
const { open } = fs;
const moment = require("moment"); // used to format dates
moment().format();

// path where the json file is being written
let payrollReportPath = "";

let employeeShiftList = [];

const readCsvFile = (csvReportId) => {
  // this function takes the csvReportId and parses it
  fs.createReadStream(`${__dirname}/time-report-${csvReportId}.csv`)
    .pipe(
      parse({
        delimiter: ",",
        from_line: 2, // starts parsing at line 2 after the column titles
      })
    )
    .on("data", (dataRow) => {
      let payrollStartDate = "";
      let payrollEndDate = "";

      // get the date from each csv row and use momentJS to convert it into YYYY-MM-DD format
      // additionally create variables to get the first, fiftenth,
      // sixteenth and last day of the month based on the date that was passed through
      let dateString = dataRow[0];
      let dateWorked = moment(dateString, "DD/MM/YYYY").format("YYYY-MM-DD");
      let firstOfMonth = moment(dateString, "DD/MM/YYYY").format("YYYY-MM-01");
      let fifteenthOfMonth = moment(dateString, "DD/MM/YYYY").format(
        "YYYY-MM-15"
      );
      let sixteenthOfMonth = moment(dateString, "DD/MM/YYYY").format(
        "YYYY-MM-16"
      );
      let endOfMonth = moment(dateString, "DD/MM/YYYY")
        .endOf("month")
        .format("YYYY-MM-DD");

      //run momentJS to check if the date passed falls between the first and fifteenth of that month
      let dateIsBetweenFirstAndFifteenth = moment(dateWorked).isBetween(
        firstOfMonth,
        fifteenthOfMonth
      );

      // if date falls between first and fifteenth,
      //set payroll dates to be the first and fifteenth of that month
      // otherwise, set payroll dates to be sixteenth and end of month
      if (dateIsBetweenFirstAndFifteenth) {
        payrollStartDate = firstOfMonth;
        payrollEndDate = fifteenthOfMonth;
      } else {
        payrollStartDate = sixteenthOfMonth;
        payrollEndDate = endOfMonth;
      }

      //get the job grade and the hrs worked from each csv row
      // if the job grade is "A", multiply the hrs worked by $20/hr and get the totalAmount
      // otherwise, multiply the hrs worked by $30/hr (job grade "B") and get the totalAmount
      let jobGrade = dataRow[3];
      let hrsWorked = dataRow[1];
      let totalAmount = 0;

      if (jobGrade == "A") {
        totalAmount = hrsWorked * 20.0;
      } else {
        totalAmount = hrsWorked * 30.0;
      }

      //get employeeId, the calculated payroll dates and
      //the calculated totalAmount for each row and push into employeeShiftList array
      let employeeShift = {
        employeeId: dataRow[2],
        payPeriod: {
          startDate: payrollStartDate,
          endDate: payrollEndDate,
        },
        amountPaid: `$${totalAmount}.00`,
      };

      employeeShiftList.push(employeeShift);
    })
    .on("end", () => {
      //at the end of the run, sort the employeeShiftList array by employeeId and payStartDate
      employeeShiftList.sort((previous, current) => {
        return (
          previous.employeeId - current.employeeId ||
          previous.payPeriod.startDate.localeCompare(
            current.payPeriod.startDate
          )
        );
      });

      // set the json file path to have the same id as the csv that was passed in
      payrollReportPath = `${__dirname}/data/payroll-report-${csvReportId}.json`;

      //check if the json file already exists
      //if so, throw an error
      //otherwise, create a json file using the payrollReportPath and
      // write employeeShiftList on the json file
      open(payrollReportPath, "wx", (err) => {
        if (err) {
          if (err.code === "EEXIST") {
            let message = `It seems this file has previously been uploaded, please check ${err.path} to access your file.`;
            console.log(message);
            return message;
          }
          throw err;
        } else {
          writeReport(employeeShiftList, payrollReportPath);
        }
      });
    })
    .on("error", (error) => reject(new Error(`Error: ${error}`)));
};

const writeReport = (payrollInfo, payrollReportPath) => {
  const stringified = JSON.stringify({
    payrollReport: { employeeReports: payrollInfo },
  });

  fs.writeFile(payrollReportPath, stringified, (err) => {
    err ? console.log(err) : console.log("Finished!");
  });
};

readCsvFile(42);

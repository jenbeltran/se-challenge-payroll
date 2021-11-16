const { expect } = require("chai");
const payrollReportJson = require("../data/payroll-report-45.json");

// This test compares the amount of rows in payroll-report-45.json 
// to the amount of rows in the time-report-45.csv file
describe("readCsvFile and writeReport function", () => {
  it("It should have the correct length", () => {
    expect(
      payrollReportJson.payrollReport.employeeReports.length
    ).to.equal(31);
  });
});

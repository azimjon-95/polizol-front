import React, { useEffect } from "react";
import { FaUserDoctor } from "react-icons/fa6";
import { LiaMoneyBillWaveSolid } from "react-icons/lia";
import { FaUsers } from "react-icons/fa6";
import { TbFilePercent } from "react-icons/tb";
import { GiTakeMyMoney } from "react-icons/gi";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import "./style.css"; // Assuming the CSS file exists and styles the component

const NumberFormat = (value) => {
  if (!value) return "0";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const mockCombinedData = [
  {
    idNumber: "DOC001",
    firstName: "John",
    lastName: "Smith",
    specialization: "Cardiologist",
    docORrecep: "doctor",
    percent: 10, // Percentage of totalPrice that the doctor earns
    salary: 5000000, // Base salary in so'm, used if percent is absent
    today: 5, // Number of patients seen today
    totalPrice: 25000000, // Total revenue generated in so'm
    clientLength: 50, // Total number of clients (patients)
    ownPrice: 2500000, // Doctor's earnings (percent * totalPrice)
  },
  {
    idNumber: "DOC002",
    firstName: "Emily",
    lastName: "Johnson",
    specialization: "Neurologist",
    docORrecep: "doctor",
    percent: 15,
    salary: 6000000,
    today: 3,
    totalPrice: 18000000,
    clientLength: 40,
    ownPrice: 2700000,
  },
  {
    idNumber: "DOC003",
    firstName: "Michael",
    lastName: "Brown",
    specialization: "Pediatrician",
    docORrecep: "doctor",
    percent: 12,
    salary: 4500000,
    today: 7,
    totalPrice: 30000000,
    clientLength: 60,
    ownPrice: 3600000,
  },
  {
    idNumber: "DOC004",
    firstName: "Sarah",
    lastName: "Davis",
    specialization: "Dermatologist",
    docORrecep: "doctor",
    percent: 8,
    salary: 4000000,
    today: 4,
    totalPrice: 20000000,
    clientLength: 45,
    ownPrice: 1600000,
  },
  {
    idNumber: "DOC005",
    firstName: "David",
    lastName: "Wilson",
    specialization: "Orthopedist",
    docORrecep: "doctor",
    percent: 20,
    salary: 7000000,
    today: 6,
    totalPrice: 35000000,
    clientLength: 70,
    ownPrice: 7000000,
  },
  {
    idNumber: "DOC006",
    firstName: "Laura",
    lastName: "Martinez",
    specialization: "Gynecologist",
    docORrecep: "doctor",
    percent: 10,
    salary: 5500000,
    today: 5,
    totalPrice: 22000000,
    clientLength: 50,
    ownPrice: 2200000,
  },
  {
    idNumber: "DOC007",
    firstName: "James",
    lastName: "Taylor",
    specialization: "Oncologist",
    docORrecep: "doctor",
    percent: 18,
    salary: 6500000,
    today: 2,
    totalPrice: 15000000,
    clientLength: 30,
    ownPrice: 2700000,
  },
  {
    idNumber: "DOC008",
    firstName: "Anna",
    lastName: "Anderson",
    specialization: "Endocrinologist",
    docORrecep: "doctor",
    percent: 14,
    salary: 5200000,
    today: 4,
    totalPrice: 24000000,
    clientLength: 55,
    ownPrice: 3360000,
  },
  {
    idNumber: "DOC009",
    firstName: "Robert",
    lastName: "Thomas",
    specialization: "Urologist",
    docORrecep: "doctor",
    percent: 16,
    salary: 5800000,
    today: 3,
    totalPrice: 19000000,
    clientLength: 42,
    ownPrice: 3040000,
  },
  {
    idNumber: "DOC010",
    firstName: "Lisa",
    lastName: "Jackson",
    specialization: "Psychiatrist",
    docORrecep: "doctor",
    percent: 12,
    salary: 4800000,
    today: 6,
    totalPrice: 28000000,
    clientLength: 65,
    ownPrice: 3360000,
  },
];

function DoctorsSlite() {
  const navigate = useNavigate();

  const allDoctors = { data: mockCombinedData }; // Mimic useGetAllDoctorsQuery structure
  const allReports = { innerData: mockCombinedData }; // Mimic useGetReportsQuery structure
  const isLoading = false; // Simulate no loading state
  const error = null; // Simulate no error

  const onlyDoctors = allDoctors?.data?.filter(
    (i) => i.docORrecep === "doctor"
  );

  useEffect(() => {
    // Mock socket event listener
    const socketMock = {
      on: (event, callback) => {
        console.log(`Mock socket listening for ${event}`);
      },
      off: (event) => {
        console.log(`Mock socket off for ${event}`);
      },
    };
    socketMock.on("patient_paid", () => console.log("Mock refetch triggered"));
    return () => socketMock.off("patient_paid");
  }, []);

  // Handle error case (e.g., "No token provided")
  if (error?.data?.message === "No token provided") {
    message.error(error?.data?.message);
    localStorage.clear();
    navigate("/login");
  }

  const findDoctorPrice = (id) => {
    return allReports?.innerData?.find((i) => i.idNumber === id);
  };

  return (
    <div className="carousel">
      {onlyDoctors?.length > 0 ? (
        onlyDoctors?.map((value, inx) => {
          return (
            <Link
              to={`/doctorSinglePage/${value.idNumber}/${value.specialization}`}
              key={inx}
              className="card"
              style={{
                minWidth: value?.firstName.length >= 11 ? "180px" : "150px",
              }}
            >
              <div className="card-inner">
                <FaUserDoctor className="card_icon" />
                <span className="doctorname">
                  {value?.firstName
                    ? value?.firstName?.toUpperCase() +
                    "." +
                    value?.lastName[0]?.toUpperCase()
                    : ""}
                </span>
                <b>{value?.specialization}</b>
              </div>
              <div className="allInfoTotal">
                <div className="sDay">
                  {isLoading
                    ? "Loading..."
                    : findDoctorPrice(value?.idNumber)?.today}
                </div>
                <div className="CountDay-M">
                  <LiaMoneyBillWaveSolid />{" "}
                  {NumberFormat(findDoctorPrice(value?.idNumber)?.totalPrice)}
                </div>
                <div className="CountDay-M">
                  <FaUsers />
                  {" " +
                    NumberFormat(
                      findDoctorPrice(value?.idNumber)?.clientLength
                    )}
                </div>
                <div className="CountDay-M">
                  {value?.percent ? (
                    <div className="CountDay-Box">
                      <div className="CountDay-M">
                        <TbFilePercent /> {value?.percent}%
                      </div>
                      <div className="CountDay-M">
                        <GiTakeMyMoney />{" "}
                        {" " +
                          NumberFormat(
                            findDoctorPrice(value.idNumber)?.ownPrice
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="CountDay-M">
                      <GiTakeMyMoney /> {NumberFormat(value.salary)} so'm
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })
      ) : (
        <>
          {/* Skeleton loading placeholders when no doctors are available */}
          {[...Array(4)].map((_, index) => (
            <div className="cardSkl" key={index}>
              <div className="headerSkl">
                <div className="imgSkl"></div>
                <div className="details">
                  <span className="nameSkl"></span>
                  <span className="about"></span>
                </div>
              </div>
              <div className="description">
                <div className="lineSkl line-1"></div>
                <div className="lineSkl line-2"></div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default DoctorsSlite;
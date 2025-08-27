import React from "react";
import "./loadingStyle.css";

const SalaryLoadingState = () => {
  const months = [
    { value: 1, label: "Yanvar" },
    { value: 2, label: "Fevral" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Aprel" },
    { value: 5, label: "May" },
    { value: 6, label: "Iyun" },
    { value: 7, label: "Iyul" },
    { value: 8, label: "Avgust" },
    { value: 9, label: "Sentyabr" },
    { value: 10, label: "Oktyabr" },
    { value: 11, label: "Noyabr" },
    { value: 12, label: "Dekabr" },
  ];

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="las-salary-container">
      {/* Summary Cards Skeleton */}
      {/* <div className="las-summary-cards">
                <div className="las-summary-cards-btn">
                    <div className="las-skeleton las-skeleton-icon"></div>
                </div>

                <div className="las-summary-card">
                    <div className="las-card-label">
                        <div className="las-skeleton las-skeleton-emoji"></div>
                        <div className="las-skeleton las-skeleton-text-small"></div>
                    </div>
                    <div className="las-card-amount">
                        <div className="las-skeleton las-skeleton-amount"></div>
                    </div>
                </div>

                <div className="las-summary-card">
                    <div className="las-card-label">
                        <div className="las-skeleton las-skeleton-emoji"></div>
                        <div className="las-skeleton las-skeleton-text-small"></div>
                    </div>
                    <div className="las-card-amount">
                        <div className="las-skeleton las-skeleton-amount"></div>
                    </div>
                </div>

                <div className="las-summary-card">
                    <div className="las-card-label">
                        <div className="las-skeleton las-skeleton-emoji"></div>
                        <div className="las-skeleton las-skeleton-text-small"></div>
                    </div>
                    <div className="las-card-amount">
                        <div className="las-skeleton las-skeleton-amount"></div>
                    </div>
                </div>

                <div className="las-summary-card">
                    <div className="las-card-label">
                        <div className="las-skeleton las-skeleton-emoji"></div>
                        <div className="las-skeleton las-skeleton-text-small"></div>
                    </div>
                    <div className="las-card-amount">
                        <div className="las-skeleton las-skeleton-amount"></div>
                    </div>
                </div>
            </div> */}

      {/* Table Container */}
      <div className="las-employees-table-container">
        {/* Table Header */}
        <div className="las-table-header">
          <h2 className="las-table-title">
            ({months.find((m) => m.value === currentMonth)?.label} {currentYear}
            )
          </h2>
          <div className="las-month-selector">
            <div className="las-select-group">
              <label className="las-select-label">📅 Oy</label>
              <div className="las-skeleton las-skeleton-select"></div>
            </div>
            <div className="las-select-group">
              <label className="las-select-label">📅 Yil</label>
              <div className="las-skeleton las-skeleton-select"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="las-employees-table-container-skeleton">
          <table className="las-employees-table">
            <thead className="las-table-head">
              <tr>
                <th>👤 Ishchi</th>
                <th>🏢 Bo'lim</th>
                <th>💰 Maosh turi</th>
                <th>💰 Asosiy maosh</th>
                <th>💵 To'langan</th>
                <th>⚠️ Jarimalar</th>
                <th>💸 Avans</th>
                <th>⏳ Qolgan</th>
                <th>📊 Holat</th>
                <th>⚙️ Amallar</th>
              </tr>
            </thead>
            <tbody className="las-table-body">
              {Array.from({ length: 9 }).map((_, index) => (
                <tr key={index}>
                  <td>
                    <div className="las-employee-name">
                      <div className="las-skeleton las-skeleton-name"></div>
                    </div>
                  </td>
                  <td>
                    <div className="las-skeleton las-skeleton-badge"></div>
                  </td>
                  <td>
                    <div className="las-skeleton las-skeleton-badge"></div>
                  </td>
                  <td>
                    <div className="las-skeleton las-skeleton-currency"></div>
                  </td>
                  <td>
                    <div className="las-skeleton las-skeleton-currency"></div>
                  </td>
                  <td>
                    <div className="las-skeleton las-skeleton-currency"></div>
                  </td>
                  <td>
                    <div className="las-skeleton las-skeleton-currency"></div>
                  </td>
                  <td>
                    <div className="las-skeleton las-skeleton-currency"></div>
                  </td>
                  <td>
                    <div className="las-skeleton las-skeleton-status"></div>
                  </td>
                  <td>
                    <div className="las-action-buttons">
                      <div className="las-skeleton las-skeleton-button"></div>
                      <div className="las-skeleton las-skeleton-button"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryLoadingState;

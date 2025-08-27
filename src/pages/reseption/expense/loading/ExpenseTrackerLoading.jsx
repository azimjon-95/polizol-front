import React from 'react';
import './style.css';

const ExpenseTrackerLoading = () => {
    return (
        <div class="load-container">
            <div class="load-expense-tracker">
                <h1 class="load-title">Expense Tracker</h1>
                <p class="load-subtitle">Xarajatlaringizni boshqaring</p>

                <div class="load-spinner-container">
                    <div class="load-spinner"></div>
                    <div class="load-inner-spinner"></div>
                </div>

                <div class="load-money-icons">
                    <div class="load-money-icon">💰</div>
                    <div class="load-money-icon">💳</div>
                    <div class="load-money-icon">📊</div>
                </div>

                <div class="load-progress-bar">
                    <div class="load-progress-fill"></div>
                </div>

                <div class="load-dots">
                    <div class="load-dot"></div>
                    <div class="load-dot"></div>
                    <div class="load-dot"></div>
                </div>
            </div>
        </div>
    )
}

export default ExpenseTrackerLoading

import React from 'react';
import './style.css';
// import { useGetEmployeeFinanceHistoryQuery } from '../../../../context/productionApi';
import { useGetEmployeeFinanceHistoryQuery } from '../../../../context/alarApi';

function FinanceHistory({ employeeId, fullName, lang = 'uz' }) {
    const { data: financeData, isLoading, error } = useGetEmployeeFinanceHistoryQuery(employeeId);

    // Translation object
    const translations = {
        uz: {
            title: 'moliyaviy tarixi',
            payment: 'To\'lov',
            penalty: 'Jarima',
            monthly: 'Oylik',
            daily: 'Kunlik',
            cash: 'Naqt',
            card: 'Karta',
            transfer: 'O\'tkazma',
            delay: 'Kechikish',
            absence: 'Kelmaslik',
            violation: 'Qoidabuzarlik',
            active: 'Aktiv',
            completed: 'Bajarildi',
            loading: 'Yuklanmoqda...',
            error: 'Xatolik yuz berdi',
            noData: 'Ma\'lumot topilmadi',
            sum: 'so\'m'
        },
        ru: {
            title: 'Финансовая История',
            payment: 'Оплата',
            penalty: 'Штраф',
            monthly: 'Месячная',
            daily: 'Дневная',
            cash: 'Наличные',
            card: 'Карта',
            transfer: 'Перевод',
            delay: 'Опоздание',
            absence: 'Отсутствие',
            violation: 'Нарушение',
            active: 'Активный',
            completed: 'Выполнено',
            loading: 'Загрузка...',
            error: 'Произошла ошибка',
            noData: 'Данные не найдены',
            sum: 'сум'
        },
        en: {
            title: 'Finance History',
            payment: 'Payment',
            penalty: 'Penalty',
            monthly: 'Monthly',
            daily: 'Daily',
            cash: 'Cash',
            card: 'Card',
            transfer: 'Transfer',
            delay: 'Delay',
            absence: 'Absence',
            violation: 'Violation',
            active: 'Active',
            completed: 'Completed',
            loading: 'Loading...',
            error: 'An error occurred',
            noData: 'No data found',
            sum: 'sum'
        }
    };

    const t = translations[lang] || translations.uz;

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format amount
    const formatAmount = (amount) => {
        return amount?.toLocaleString() || '0';
    };

    // Get type translation
    const getTypeTranslation = (type, subType) => {
        if (type === 'payment') {
            return t.payment;
        } else if (type === 'penalty') {
            return t.penalty;
        }
        return type;
    };

    // Get sub-type translation
    const getSubTypeTranslation = (type, subType) => {
        const subTypeMap = {
            oylik: t.monthly,
            kunlik: t.daily,
            naqt: t.cash,
            karta: t.card,
            otkazma: t.transfer,
            kechikish: t.delay,
            kelmaslik: t.absence,
            qoidabuzarlik: t.violation,
            aktiv: t.active,
            bajarildi: t.completed
        };
        return subTypeMap[subType] || subType;
    };

    if (isLoading) {
        return (
            <div className="ghl-finance-history">
                <div className="ghl-loading">
                    <div className="ghl-spinner"></div>
                    <p>{t.loading}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ghl-finance-history">
                <div className="ghl-error">
                    <div className="ghl-error-icon">⚠️</div>
                    <p>{t.error}</p>
                </div>
            </div>
        );
    }

    if (!financeData || financeData.length === 0) {
        return (
            <div className="ghl-finance-history">
                <div className="ghl-no-data">
                    <div className="ghl-no-data-icon">📋</div>
                    <p>{t.noData}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ghl-finance-history">
            <h2 className="ghl-title">{fullName}ning  {t.title}</h2>
            <div className="ghl-history-list">
                {financeData?.innerData?.map((item, index) => (
                    <div
                        key={index}
                        className={`ghl-history-item ${item.type === 'payment' ? 'ghl-payment' : 'ghl-penalty'}`}
                    >
                        <div className="ghl-item-header">
                            <div className="ghl-type-indicator">
                                <span className={`ghl-type-badge ${item.type}`}>
                                    {item.type === 'payment' ? '💰' : '⚠️'}
                                </span>
                                <div className="ghl-type-info">
                                    <h3 className="ghl-type-title">
                                        {getTypeTranslation(item.type, item.salaryType || item.penaltyType)}
                                    </h3>
                                    {(item.salaryType || item.penaltyType) && (
                                        <span className="ghl-sub-type">
                                            {getSubTypeTranslation(item.type, item.salaryType || item.penaltyType)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="ghl-amount">
                                <span className={`ghl-amount-value ${item.type}`}>
                                    {item.type === 'penalty' ? '-' : '+'}{formatAmount(item.amount)}
                                </span>
                                <span className="ghl-currency">{t.sum}</span>
                            </div>
                        </div>

                        <div className="ghl-item-details">
                            {item.description && (
                                <p className="ghl-description">{item.description}</p>
                            )}
                            {item.reason && (
                                <p className="ghl-reason">{item.reason}</p>
                            )}
                            <div className="ghl-meta-info">
                                {item.paymentMethod && (
                                    <span className="ghl-payment-method">
                                        {getSubTypeTranslation(item.type, item.paymentMethod)}
                                    </span>
                                )}
                                {item.status && (
                                    <span className={`ghl-status ${item.status}`}>
                                        {getSubTypeTranslation(item.type, item.status)}
                                    </span>
                                )}
                                <span className="ghl-date">{formatDate(item.date)}</span>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}

export default FinanceHistory;
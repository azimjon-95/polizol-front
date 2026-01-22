import React, { useState, useMemo } from 'react';
import { Card, Typography, Divider, Input, Tag, Table, Button, Select } from 'antd';
import { useSelector } from "react-redux";
import { MdOutlineConfirmationNumber } from "react-icons/md";
import {
    LuPackagePlus, LuBuilding2, LuPhone, LuCalendar, LuDollarSign, LuCreditCard, LuTruck, LuMapPin,
    LuUsers, LuFileText, LuChevronRight, LuChevronDown, LuPackage, LuWeight, LuBanknote, LuFilter
} from 'react-icons/lu';
import { MdAccountBalance } from "react-icons/md";
import { useGetIncomesQuery } from "../../context/materialApi";
import { useGetBalanceQuery } from "../../context/expenseApi";
import { numberFormat } from '../../utils/numberFormat';
import { PhoneNumberFormat } from '../../hook/NumberFormat';
// LuMapPin

import './style/incom.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const IncomeListModal = () => {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const date = new Date();
        return `${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    });
    const [selectedFirm, setSelectedFirm] = useState('all');
    const [debtFilter, setDebtFilter] = useState('all');
    const { data: balanceData } = useGetBalanceQuery();
    const { data: incomesData, isLoading: incomesIsLoading } = useGetIncomesQuery();

    const firmsDataList = useMemo(() => incomesData?.innerData || [], [incomesData]);

    const searchTextValue = useSelector((s) => s.search.searchQuery);

    const uniqueFirms = useMemo(() => {
        const firms = firmsDataList
            .map((firm) => firm.name || "Noma'lum firma")
            .filter((value, index, self) => self.indexOf(value) === index);
        return ['all', ...firms.sort()];
    }, [firmsDataList]);

    const filteredFirms = firmsDataList;

    const { totalIncomes, totalAmount, totalPaid, totalDebt, vatAmount } = useMemo(() => {
        return filteredFirms.reduce(
            (acc, firm) => {
                const firmTotal = firm.history?.reduce((s, h) => s + (h.totalWithVat || 0), 0) || 0;
                const firmWithoutVat = firm.history?.reduce((s, h) => s + (h.totalWithoutVat || 0), 0) || 0;
                const firmVat = firmTotal - firmWithoutVat;
                return {
                    totalIncomes: acc.totalIncomes + (firm.history?.length || 0),
                    totalAmount: acc.totalAmount + firmTotal,
                    totalPaid: acc.totalPaid + (firm.totalPaid || 0),
                    totalDebt: acc.totalDebt + (firm.totalDebt || 0),
                    vatAmount: acc.vatAmount + firmVat
                };
            },
            { totalIncomes: 0, totalAmount: 0, totalPaid: 0, totalDebt: 0, vatAmount: 0 }
        );
    }, [filteredFirms]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        if (/^[0-1]?\d?(\.\d{0,4})?$/.test(value)) {
            setSelectedMonth(value);
        }
    };

    const handleBlur = () => {
        if (selectedMonth && !/^(0[1-9]|1[0-2])\.\d{4}$/.test(selectedMonth)) {
            setSelectedMonth('');
        }
    };

    const materialColumns = [
        {
            title: <span className="nns-table-header"><LuPackage className="nns-icon" /> Material</span>,
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <div className="nns-material-name">
                    <LuPackagePlus className="nns-material-icon" />
                    <Text strong>{text || 'Noma\'lum'}</Text>
                    <Tag className="nns-category-tag">Noma'lum</Tag>
                </div>
            )
        },
        {
            title: <span className="nns-table-header"><LuWeight className="nns-icon" /> Miqdor</span>,
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity) => (
                <Tag className="nns-quantity-tag">
                    {numberFormat(quantity || 0)} dona
                </Tag>
            )
        },
        {
            title: <span className="nns-table-header"><LuDollarSign className="nns-icon" /> Narx</span>,
            dataIndex: 'price',
            key: 'price',
            render: (price) => (
                <Tag className="nns-price-tag nns-price-sum">
                    {numberFormat(Math.floor(price || 0))} so'm
                </Tag>
            )
        },
        {
            title: <span className="nns-table-header"><LuBanknote className="nns-icon" /> Jami</span>,
            key: 'total',
            render: (_, record) => (
                <Tag className="nns-total-tag">
                    {numberFormat((record.price || 0) * (record.quantity || 0))} so'm
                </Tag>
            )
        },
        {
            title: <span className="nns-table-header"><LuTruck className="nns-icon" /> Transport</span>,
            key: 'transport',
            render: () => (
                <Tag className="nns-transport-tag">
                    0 so'm
                </Tag>
            )
        },
        {
            title: <span className="nns-table-header"><LuUsers className="nns-icon" /> Ishchi</span>,
            key: 'worker',
            render: () => (
                <Tag className="nns-worker-tag">
                    0 so'm
                </Tag>
            )
        }
    ];

    const workerColumns = [
        {
            title: <span className="nns-table-header"><LuUsers className="nns-icon" /> Ishchi</span>,
            key: 'worker',
            render: (_, record) => (
                <div className="nns-worker-info">
                    <Text strong>{record.workerId?.firstName || 'Noma\'lum'} {record.workerId?.lastName || ''}</Text>
                    <Text className="nns-worker-position">{record.workerId?.position || 'Noma\'lum'}</Text>
                </div>
            )
        },
        {
            title: <span className="nns-table-header"><LuDollarSign className="nns-icon" /> To'lov</span>,
            dataIndex: 'payment',
            key: 'payment',
            render: (payment) => (
                <Tag className="nns-payment-tag">
                    {numberFormat(payment || 0)} so'm
                </Tag>
            )
        }
    ];

    const historyColumns = [
        {
            title: <span className="nns-table-header"><LuCalendar className="nns-icon" /> Sana</span>,
            dataIndex: 'date',
            key: 'date',
            render: (date) => new Date(date).toLocaleDateString('uz-UZ')
        },
        {
            title: <span className="nns-table-header"><LuDollarSign className="nns-icon" /> Umumiy summa</span>,
            dataIndex: 'totalWithVat',
            key: 'total',
            render: (total) => (
                <Tag className="nns-amount-tag">
                    {numberFormat(total || 0)} so'm
                </Tag>
            )
        },
        {
            title: <span className="nns-table-header"><LuBanknote className="nns-icon" /> Qarz holati</span>,
            dataIndex: 'debtStatus',
            key: 'status',
            render: (status) => (
                <Tag className="nns-debt-tag">
                    {status === 'fully_paid' ? 'To\'liq to\'langan' :
                        status === 'partially_paid' ? 'Qisman to\'langan' : 'To\'lanmagan'}
                </Tag>
            )
        },
        {
            title: <span className="nns-table-header"><LuCreditCard className="nns-icon" /> To\'lov turi</span>,
            dataIndex: 'paymentType',
            key: 'paymentType',
            render: (method) => (
                <Tag className={`nns-payment-type-tag nns-payment-${method || 'naqt'}`}>
                    {method === 'naqt' ? 'Naqt' : 'Bank'}
                </Tag>
            )
        }
    ];

    const firmColumns = [
        {
            title: <span className="nns-table-header"><LuBuilding2 className="nns-icon" /> Firma</span>,
            key: 'firm',
            render: (_, firm) => (
                <div className="nns-firm-info">
                    <LuBuilding2 className="nns-firm-icon" />
                    <div className="nns-firm-details">
                        <Text strong className="nns-firm-name">{firm.name || "Noma'lum firma"}</Text>
                        <Text className="nns-firm-phone">
                            <LuPhone className="nns-phone-icon" />
                            {PhoneNumberFormat(firm.phone) || "Telefon yo'q"}
                        </Text>
                    </div>
                </div>
            )
        },
        {
            title: <span className="nns-table-header">
                <LuMapPin className="nns-icon" /> Manzil</span>,
            key: 'address',
            render: (_, firm) => (
                <Text className="nns-address">{firm.address || "Noma'lum manzil"}</Text>
            )
        },
        {
            title: <span className="nns-table-header"><LuFileText className="nns-icon" /> Kirimlar soni</span>,
            key: 'count',
            render: (_, firm) => (
                <Tag className="nns-date-tag">
                    <LuFileText className="nns-tag-icon" />
                    {firm.history?.length || 0}
                </Tag>
            )
        },
        {
            title: <span className="nns-table-header"><LuCreditCard className="nns-icon" /> To'langan</span>,
            key: 'paidAmount',
            render: (_, firm) => {
                const paid = firm.totalPaid || 0;
                return (
                    <Tag className="nns-payment-tag nns-paid-amount">
                        <LuCreditCard className="nns-tag-icon" />
                        {numberFormat(paid)} so'm
                    </Tag>
                );
            }
        },
        {
            title: <span className="nns-table-header"><LuBanknote className="nns-icon" /> Qarz</span>,
            key: 'debtAmount',
            render: (_, firm) => {
                const debt = firm.totalDebt || 0;
                return (
                    <Tag className={`nns-debt-tag ${debt > 0 ? 'nns-debt-amount' : 'nns-no-debt'}`}>
                        <LuBanknote className="nns-tag-icon" />
                        {numberFormat(debt)} so'm
                    </Tag>
                );
            }
        }
    ];

    const expandedFirmRowRender = (firm) => {
        const sumWithoutVat = firm.history?.reduce((s, h) => s + (h.totalWithoutVat || 0), 0) || 0;
        const sumTotal = firm.history?.reduce((s, h) => s + (h.totalWithVat || 0), 0) || 0;
        const sumVatAmount = sumTotal - sumWithoutVat;
        const firmPaid = firm.totalPaid || 0;
        const firmDebt = firm.totalDebt || 0;
        const vatPercentage = firm.history?.[0]?.vatPercentage || 0;
        const debtStatus = firmDebt === 0 ? 'To\'liq to\'langan' :
            (firmPaid > 0 ? 'Qisman to\'langan' : 'To\'lanmagan');

        return (
            <div className="nns-income-details">
                <div className="nns-financial-summary">
                    <div className="nns-summary-item">
                        <Text className="nns-summary-label">QQSsiz summa:</Text>
                        <Text strong className="nns-summary-value">
                            {numberFormat(Math.floor(sumWithoutVat))} so'm
                        </Text>
                    </div>
                    <div className="nns-summary-item">
                        <Text className="nns-summary-label">QQS ({vatPercentage}%):</Text>
                        <Text strong className="nns-summary-value">
                            {numberFormat(Math.floor(sumVatAmount))} so'm
                        </Text>
                    </div>
                    <div className="nns-summary-item">
                        <Text className="nns-summary-label">QQSli summa:</Text>
                        <Text strong className="nns-summary-value nns-total-amount">
                            {numberFormat(sumTotal)} so'm
                        </Text>
                    </div>
                    <div className="nns-summary-item">
                        <Text className="nns-summary-label">To'langan:</Text>
                        <Text strong className="nns-summary-value nns-paid-amount">
                            {numberFormat(firmPaid)} so'm
                        </Text>
                    </div>
                    <div className="nns-summary-item">
                        <Text className="nns-summary-label">Qarz:</Text>
                        <Text strong className={`nns-summary-value ${firmDebt > 0 ? 'nns-debt-amount' : 'nns-no-debt'}`}>
                            {numberFormat(firmDebt)} so'm
                        </Text>
                    </div>
                    <div className="nns-summary-item">
                        <Text className="nns-summary-label">Qarz holati:</Text>
                        <Text strong className="nns-summary-value">
                            {debtStatus}
                        </Text>
                    </div>
                    <div className="nns-summary-item">
                        <Text className="nns-summary-label">Transport xarajati:</Text>
                        <Text strong className="nns-summary-value">
                            0 so'm
                        </Text>
                    </div>
                    <div className="nns-summary-item">
                        <Text className="nns-summary-label">Ishchi xarajati:</Text>
                        <Text strong className="nns-summary-value">
                            0 so'm
                        </Text>
                    </div>
                </div>

                <Divider className="nns-section-divider" />

                <div className="nns-history-section">
                    <Title level={5} className="nns-section-title">
                        <LuFileText className="nns-section-icon" />
                        Tarix (Kirimlar)
                    </Title>
                    <Table
                        dataSource={firm.history || []}
                        columns={historyColumns}
                        pagination={false}
                        size="small"
                        className="nns-history-table"
                        rowKey="incomeId"
                        expandable={{
                            expandedRowRender: (historyItem) => (
                                <div>
                                    <Divider className="nns-section-divider" />
                                    <div className="nns-materials-section">
                                        <Title level={5} className="nns-section-title">
                                            <LuPackage className="nns-section-icon" />
                                            Materiallar
                                        </Title>
                                        <Table
                                            dataSource={historyItem.materials || []}
                                            columns={materialColumns}
                                            pagination={false}
                                            size="small"
                                            className="nns-materials-table"
                                            rowKey="_id"
                                        />
                                    </div>
                                    {historyItem.workerPayments && historyItem.workerPayments.length > 0 && (
                                        <>
                                            <Divider className="nns-section-divider" />
                                            <div className="nns-workers-section">
                                                <Title level={5} className="nns-section-title">
                                                    <LuUsers className="nns-section-icon" />
                                                    Ishchi to'lovlari
                                                </Title>
                                                <Table
                                                    dataSource={historyItem.workerPayments}
                                                    columns={workerColumns}
                                                    pagination={false}
                                                    size="small"
                                                    className="nns-workers-table"
                                                    rowKey="_id"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ),
                            expandIcon: ({ expanded, onExpand, record }) =>
                                expanded ? (
                                    <LuChevronDown onClick={(e) => onExpand(record, e)} />
                                ) : (
                                    <LuChevronRight onClick={(e) => onExpand(record, e)} />
                                )
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="nns-warehouse-modal nns-income-list-modal">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <div className="nns-modal-header">
                <Title level={3} className="nns-modal-title">
                    <LuFileText className="nns-title-icon" />
                    Kirimlar ro'yxati
                </Title>
                <div className="nns-filter-group">

                    <Select
                        className="nns-firm-filter"
                        value={selectedFirm}
                        onChange={setSelectedFirm}
                        placeholder="Firma filter"
                        style={{ width: 200 }}
                    >
                        {uniqueFirms.map((firm) => (
                            <Option key={firm} value={firm}>
                                <LuBuilding2 className="nns-filter-icon" />
                                {firm === 'all' ? 'Hammasi' : firm}
                            </Option>
                        ))}
                    </Select>
                    <Select
                        className="nns-debt-filter"
                        value={debtFilter}
                        onChange={setDebtFilter}
                        placeholder="Qarz filter"
                        style={{ width: 150 }}
                    >
                        <Option value="all"><LuFilter className="nns-filter-icon" /> Hammasi</Option>
                        <Option value="debt"><LuBanknote className="nns-filter-icon" /> Qarzli</Option>
                        <Option value="paid"><LuCreditCard className="nns-filter-icon" /> To'langan</Option>
                    </Select>

                    <Link style={{
                        color: '#002bac',
                        fontSize: '20px',
                        border: '1px solid #002bac',
                        padding: '6px 5px 0px 5px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }} to="/firm">
                        <MdOutlineConfirmationNumber />
                    </Link>
                </div>
            </div>

            <div className="nns-header-cards">

                <Card className="nns-stat-card nns-stat-card-incomes">
                    <div className="nns-stat-content">
                        <div className="nns-stat-icon"><LuFileText /></div>
                        <div className="nns-stat-info">
                            <Text className="nns-stat-number">{totalIncomes}</Text>
                            <Text className="nns-stat-label">Jami kirimlar</Text>
                        </div>
                    </div>
                </Card>
                <Card className="nns-stat-card nns-stat-card-amount">
                    <div className="nns-stat-content">
                        <div className="nns-stat-icon"><LuDollarSign /></div>
                        <div className="nns-stat-info">
                            <Text className="nns-stat-number">{numberFormat(totalAmount)}</Text>
                            <Text className="nns-stat-label">Umumiy summa</Text>
                        </div>
                    </div>
                </Card>
                <Card className="nns-stat-card nns-stat-card-paid">
                    <div className="nns-stat-content">
                        <div className="nns-stat-icon"><LuCreditCard /></div>
                        <div className="nns-stat-info">
                            <Text className="nns-stat-number">{numberFormat(totalPaid)}</Text>
                            <Text className="nns-stat-label">To'langan</Text>
                        </div>
                    </div>
                </Card>
                <Card className="nns-stat-card nns-stat-card-debt">
                    <div className="nns-stat-content">
                        <div className="nns-stat-icon"><LuBanknote /></div>
                        <div className="nns-stat-info">
                            <Text className="nns-stat-number">{numberFormat(totalDebt)}</Text>
                            <Text className="nns-stat-label">Qarzlar</Text>
                        </div>
                    </div>
                </Card>
                <Card className="nns-stat-card nns-stat-card-vat">
                    <div className="nns-stat-content">
                        <div className="nns-stat-icon"><LuBanknote /></div>
                        <div className="nns-stat-info">
                            <Text className="nns-stat-number">{numberFormat(Math.floor(vatAmount))}</Text>
                            <Text className="nns-stat-label">Jami QQS</Text>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="nns-income-container">
                {incomesIsLoading ? (
                    <div className="nns-loading-container">
                        <div className="nns-loading-spinner"></div>
                        <Text>Kirimlar yuklanmoqda...</Text>
                    </div>
                ) : filteredFirms.length === 0 ? (
                    <div className="nns-empty-state">
                        <div className="nns-empty-icon">📋</div>
                        <Title level={4} className="nns-empty-title">
                            {searchTextValue || selectedFirm !== 'all' ? 'Qidiruv natijalari topilmadi' : "Hozircha kirimlar yo'q"}
                        </Title>
                        <Text className="nns-empty-text">
                            {searchTextValue || selectedFirm !== 'all' ? "Boshqa kalit so'z yoki firma bilan qidiring" : "Yangi material kelganda bu yerda ko'rinadi"}
                        </Text>
                    </div>
                ) : (
                    <Table
                        columns={firmColumns}
                        dataSource={filteredFirms}
                        rowKey="firmId"
                        pagination={false}
                        size="small"
                        expandable={{
                            expandedRowRender: expandedFirmRowRender,
                            expandIcon: ({ expanded, onExpand, record }) =>
                                expanded ? (
                                    <LuChevronDown onClick={(e) => onExpand(record, e)} />
                                ) : (
                                    <LuChevronRight onClick={(e) => onExpand(record, e)} />
                                )
                        }}
                        className="nns-firms-table"
                    />
                )}
            </div>
        </div>
    );
};

export default IncomeListModal;
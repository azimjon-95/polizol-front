import React, { useMemo } from 'react';
import { useGetMonthlyDashboardQuery } from '../../../context/dashboardApi';
import { MdAdminPanelSettings } from 'react-icons/md';
import { useMediaQuery } from 'react-responsive';
import { NumberFormat } from '../../../hook/NumberFormat';
import { useSelector } from 'react-redux';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LabelList,
} from 'recharts';
import {
    CircleDollarSign,
    TrendingUp,
    Star,
    Award,
    TrendingDown,
    PackageCheck,
    Boxes,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    ShoppingCart,
    BarChart2,
    PieChart as PieChartIcon,
    ShoppingBag,
} from 'lucide-react';
import { useGetTopProductsByMonthQuery } from "../../../context/productionApi";
import './clinicDashboard.css';

// Skeleton Components
const SkeletonStatCard = () => (
    <div className="stat-card skeleton-card">
        <div className="stat-content">
            <div>
                <div className="skeleton skeleton-label"></div>
                <div className="skeleton skeleton-value"></div>
            </div>
            <div className="skeleton skeleton-icon"></div>
        </div>
    </div>
);

const SkeletonLineChart = () => (
    <div className="card">
        <h3 className="card-title">
            <div className="skeleton skeleton-icon"></div>
            <div className="skeleton skeleton-title"></div>
        </h3>
        <div className="skeleton skeleton-chart"></div>
    </div>
);

const SkeletonSalespersonCard = () => (
    <div className="salesperson-card">
        <div className="salesperson-header">
            <div className="salesperson-info">
                <div className="skeleton skeleton-rank-badge"></div>
                <div className="skeleton skeleton-name"></div>
            </div>
            <div className="skeleton skeleton-percentage"></div>
        </div>
        <div className="progress-section">
            <div className="progress-labels">
                <div className="skeleton skeleton-label"></div>
                <div className="skeleton skeleton-label"></div>
            </div>
            <div className="progress-bar">
                <div className="skeleton skeleton-progress"></div>
            </div>
        </div>
        <div className="salesperson-stats">
            <div className="skeleton skeleton-stat"></div>
            <div className="skeleton skeleton-stat"></div>
        </div>
    </div>
);

const SkeletonPieChart = () => (
    <div className="card">
        <h3 className="card-title">
            <div className="skeleton skeleton-icon"></div>
            <div className="skeleton skeleton-title"></div>
        </h3>
        <div className="skeleton skeleton-chart"></div>
        <div className="payment-legend">
            {[...Array(2)].map((_, index) => (
                <div key={index} className="payment-item">
                    <div className="skeleton skeleton-color-indicator"></div>
                    <div className="skeleton skeleton-payment-name"></div>
                    <div className="skeleton skeleton-payment-amount"></div>
                </div>
            ))}
        </div>
    </div>
);

// Optimized Top Products Bar Chart Component
const TopProductsBarChart = ({ date }) => {
    const { data: TopData, isLoading } = useGetTopProductsByMonthQuery(date);

    // Memoized chart data transformation for optimization
    const chartData = useMemo(() => {
        if (!TopData?.innerData) return [];
        return TopData.innerData.map((p) => {
            let name = p._id;

            // faqat "Ruberoid " ni olib tashlaymiz
            if (name.startsWith("Ruberoid ")) {
                name = name.replace("Ruberoid ", "");
            }

            return { name, value: p.totalSold };
        });
    }, [TopData]);


    // Creative title
    const chartTitle = "Eng Ko'p Sotilgan Mahsulotlar";

    if (isLoading) {
        return (
            <div className="card">
                <h3 className="card-title">
                    <div className="skeleton skeleton-icon"></div>
                    <div className="skeleton skeleton-title"></div>
                </h3>
                <div className="skeleton skeleton-chart"></div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="card-title">
                <ShoppingBag className="icon" />
                {chartTitle}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 20, left: 12, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis
                        dataKey="name"
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 12 }}
                        stroke="#94a3b8"
                    />
                    <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                        stroke="#94a3b8"
                    />
                    <Tooltip
                        formatter={(value) => [value.toLocaleString(), "Sotilgan miqdor"]}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    />
                    <Bar
                        dataKey="value"
                        name="Sotilgan miqdor"
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                        barSize={70}
                        radius={[8, 8, 0, 0]}
                        fill="#3b82f6"
                    >
                        <LabelList dataKey="value" position="top" formatter={(value) => value.toLocaleString()} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

        </div>
    );
};

const Dashboard = () => {
    const date = useSelector((state) => state.month.selectedMonth) || new Date().toISOString().slice(0, 7);
    const { data, isLoading, isError } = useGetMonthlyDashboardQuery(date);
    const isDesktop = useMediaQuery({ query: '(min-width: 769px)' });
    const direktor = localStorage.getItem("role");

    // Memoized derived data
    const salespeople = useMemo(() => data?.innerData?.salerRatings || [], [data]);
    const paymentStats = useMemo(
        () => [
            {
                name: 'Naqd',
                value: Math.floor(data?.innerData?.paymentTypeBreakdown?.percent?.naqt) || 0,
                amount: Math.floor(data?.innerData?.paymentTypeBreakdown?.naqt) || 0,
                color: '#22c55e',
            },
            {
                name: 'Bank',
                value: Math.floor(data?.innerData?.paymentTypeBreakdown?.percent?.bank) || 0,
                amount: Math.floor(data?.innerData?.paymentTypeBreakdown?.bank) || 0,
                color: '#3b82f6',
            },
        ],
        [data]
    );
    const ndsStats = useMemo(
        () => [
            {
                name: 'Kirish',
                value: Math.floor(data?.innerData?.vatReport?.percent?.fromIncome) || 0,
                amount: Math.floor(data?.innerData?.vatReport?.fromIncome) || 0,
                color: '#22c55e',
            },
            {
                name: 'Chiqish',
                value: Math.floor(data?.innerData?.vatReport?.percent?.fromSales) || 0,
                amount: Math.floor(data?.innerData?.vatReport?.fromSales) || 0,
                color: '#3b82f6',
            },
        ],
        [data]
    );
    const dailySales = useMemo(() => data?.innerData?.dailySalesComparison || [], [data]);
    const dailyIncomeExpense = useMemo(() => data?.innerData?.dailyIncomeExpense || [], [data]);

    // Currency formatting
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ', {
            style: 'currency',
            currency: 'UZS',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const currentMonthData = data?.innerData?.stats;

    if (isError) {
        return <div className="error-message">Ma'lumotlarni yuklashda xatolik yuz berdi</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Main statistics cards */}
            <div className="stats-grid">
                {isLoading ? (
                    [...Array(8)].map((_, index) => <SkeletonStatCard key={index} />)
                ) : (
                    <>
                        <div className="stat-card balance-card">
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label_card">Hisobdagi qoldiq</p>
                                    <p className="stat-value">{NumberFormat(Math.floor(currentMonthData?.balance?.bank + currentMonthData?.balance?.naqt))}</p>
                                    <p className="stat-change">
                                        Naqt: {NumberFormat(Math.floor(currentMonthData?.balance?.naqt))}, Bank: {NumberFormat(Math.floor(currentMonthData?.balance?.bank))}
                                    </p>
                                </div>
                                <Wallet className="stat-icon" />
                            </div>
                        </div>
                        <div className="stat-card lend-card">
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label_card">Berilgan qarzlar</p>
                                    <p className="stat-value">{NumberFormat(Math.floor(currentMonthData?.lendSum))}</p>
                                </div>
                                <ArrowUpRight className="stat-icon" />
                            </div>
                        </div>
                        <div className="stat-card borrow-card">
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label_card">Olingan qarzlar</p>
                                    <p className="stat-value">{NumberFormat(Math.floor(currentMonthData?.borrowSum))}</p>
                                </div>
                                <ArrowDownLeft className="stat-icon" />
                            </div>
                        </div>
                        <div className="stat-card warehouse-card">
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label_card">Xomashyo ombori qiymati</p>
                                    <p className="stat-value">{NumberFormat(Math.floor(currentMonthData?.warehouseValue))}</p>
                                </div>
                                <Boxes className="stat-icon" />
                            </div>
                        </div>
                        <div className="stat-card finished-card">
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label_card">Tayyor mahsulotlar qiymati</p>
                                    <p className="stat-value">{NumberFormat(Math.floor(currentMonthData?.finishedProductValue))}</p>
                                </div>
                                <PackageCheck className="stat-icon" />
                            </div>
                        </div>
                        <div className="stat-card income-card">
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label_card">Jami kirim</p>
                                    <p className="stat-value">{NumberFormat(Math.floor(currentMonthData?.income))}</p>
                                    <p className={`stat-change ${currentMonthData?.incomeGrowth >= 0 ? 'positive' : 'negative'}`}>
                                        {currentMonthData?.incomeGrowth >= 0 ? '+' : ''}{currentMonthData?.incomeGrowth?.toFixed(1)}% o‘sish
                                    </p>
                                </div>
                                <TrendingUp className="stat-icon" />
                            </div>
                        </div>
                        <div className="stat-card expense-card">
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label_card">Jami chiqim</p>
                                    <p className="stat-value">{NumberFormat(Math.floor(currentMonthData?.expense))}</p>
                                    <p className={`stat-change ${currentMonthData?.expenseGrowth >= 0 ? 'positive' : 'negative'}`}>
                                        {currentMonthData?.expenseGrowth >= 0 ? '+' : ''}{currentMonthData?.expenseGrowth?.toFixed(1)}% o‘zgarish
                                    </p>
                                </div>
                                <TrendingDown className="stat-icon" />
                            </div>
                        </div>
                        <div className="stat-card profit-card">
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label_card">Sof foyda</p>
                                    <p className="stat-value">{NumberFormat(Math.floor(currentMonthData?.netProfit))}</p>
                                </div>
                                <CircleDollarSign className="stat-icon" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Daily Income and Expense */}
            {isLoading ? (
                <SkeletonLineChart />
            ) : (
                <div className="card">
                    <h3 className="card-title">
                        <BarChart2 className="icon" />
                        Kunlik Kirim va Chiqim
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyIncomeExpense}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="day" stroke="#94a3b8" />
                            {isDesktop && (
                                <YAxis
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                    stroke="#94a3b8"
                                    tickCount={8}
                                    tickSize={8}
                                />
                            )}
                            <Tooltip
                                formatter={(value, name) => [formatCurrency(value), name === 'income' ? 'Kirim' : 'Chiqim']}
                                labelFormatter={(label) => `${label}-kun`}
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} name="Kirim" />
                            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} name="Chiqim" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top Products Bar Chart */}
            <TopProductsBarChart date={date} />

            {/* Salesperson Ratings */}
            {isLoading ? (
                <div className="card">
                    <h3 className="card-title">
                        <div className="skeleton skeleton-icon"></div>
                        <div className="skeleton skeleton-title"></div>
                    </h3>
                    <div className="salespeople-grid">
                        {[...Array(4)].map((_, index) => (
                            <SkeletonSalespersonCard key={index} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="card">
                    <h3 className="card-title">
                        <Award className="icon" />
                        Sotuvchilar Reytingi va Oylik Vazifalar
                    </h3>
                    <div className="salespeople-grid">
                        {[...salespeople]
                            .sort((a, b) => b.percent - a.percent)
                            .map((person, index) => (
                                <div key={index} className="salesperson-card">
                                    <div className="salesperson-header">
                                        <div className="salesperson-info">
                                            <div className="rank-badge">{index === 0 ? <Star /> : `#${index + 1}`}</div>
                                            <h4 className="salesperson-name">{person.name}</h4>
                                        </div>
                                        <span className={`percentage ${person.percent >= 100 ? 'positive' : 'negative'}`}>
                                            {person.percent}%
                                        </span>
                                    </div>
                                    <div className="progress-section">
                                        <div className="progress-labels">
                                            <span>
                                                Vazifa: <br /> {NumberFormat(Math.floor(person.target))} so'm
                                            </span>
                                            <span>
                                                Hozirgi: <br /> {NumberFormat(Math.floor(person.current))} so'm
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${person.percent >= 100 ? 'complete' : ''}`}
                                                style={{ width: `${Math.min(person.percent, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="salesperson-stats">
                                        <span>Buyurtmalar: {person.orders}</span>
                                        <span>O'rtacha: {NumberFormat(Math.floor(person.avg))} so'm</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Daily Sales */}
            {isLoading ? (
                <SkeletonLineChart />
            ) : (
                <div className="card">
                    <h3 className="card-title">
                        <ShoppingCart className="icon" />
                        Kunlik Sotuvlar
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailySales}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="day" stroke="#94a3b8" />
                            {isDesktop && (
                                <YAxis
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                    stroke="#94a3b8"
                                    tickCount={8}
                                    tickSize={8}
                                />
                            )}
                            <Tooltip
                                formatter={(value) => [formatCurrency(Math.floor(value)), 'Sotuvlar']}
                                labelFormatter={(label) => `${label}-kun`}
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="current" stroke="#22c55e" strokeWidth={3} name="Hozirgi Oy" />
                            <Line type="monotone" dataKey="previous" stroke="#facc15" strokeWidth={3} name="Eski Oy" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Charts */}
            <div className="charts-grid">
                {isLoading ? (
                    <>
                        <SkeletonPieChart />
                        <SkeletonPieChart />
                    </>
                ) : (
                    <>
                        {/* VAT Types */}
                        <div style={{ display: direktor === "direktor" ? "none" : "block" }} className="card">
                            <h3 className="card-title">
                                <MdAdminPanelSettings className="icon" />
                                QQS Turlari
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={ndsStats}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}%`}
                                    >
                                        {ndsStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value}%`, name]}
                                        contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="payment-legend">
                                {ndsStats.map((payment) => (
                                    <div key={payment.name} className="payment-item">
                                        <div className="color-indicator" style={{ backgroundColor: payment.color }}></div>
                                        <span className="payment-name">{payment.name}</span>
                                        <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Types */}
                        <div className="card">
                            <h3 className="card-title">
                                <PieChartIcon className="icon" />
                                To'lov Turlari
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={paymentStats}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}%`}
                                    >
                                        {paymentStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value}%`, name]}
                                        contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="payment-legend">
                                {paymentStats.map((payment) => (
                                    <div key={payment.name} className="payment-item">
                                        <div className="color-indicator" style={{ backgroundColor: payment.color }}></div>
                                        <span className="payment-name">{payment.name}</span>
                                        <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
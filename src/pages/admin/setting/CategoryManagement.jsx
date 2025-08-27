import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import {
    useCreateCategoryMutation,
    useGetAllCategoriesQuery,
    useDeleteCategoryMutation,
    useUpdateCategoryMutation
} from '../../../context/categoryApi';
import {
    useCreateAdditionExpenMutation,
    useGetAllAdditionExpenQuery,
    useUpdateAdditionExpenMutation
} from '../../../context/additionExpenApi';
import './styles/ProductManagement.css';

const CatigoryManagement = () => {
    // Product form state
    const [productFormData, setProductFormData] = useState({
        category: '',
        productName: '',
        productionCost: '',
        loadingCost: ''
    });
    const [productNotification, setProductNotification] = useState({ message: '', type: '' });
    const [productEditId, setProductEditId] = useState(null);
    const [availableProducts, setAvailableProducts] = useState([]);

    // Expense form state
    const [expenseFormData, setExpenseFormData] = useState({
        saturdayWage: '',
    });
    const [expenseNotification, setExpenseNotification] = useState({ message: '', type: '' });
    const [expenseEditId, setExpenseEditId] = useState(null);

    // Product lists
    const productLists = {
        Polizol: [
            'Polizol 0.5 mm', 'Polizol 1 mm', 'Polizol 1.5 mm',
            'Polizol 2 mm', 'Polizol 2.5 mm', 'Polizol 3 mm', 'Polizol 4 mm'
        ],
        Folygoizol: [
            'Folygoizol 1 mm', 'Folygoizol 2 mm', 'Folygoizol 2.5 mm',
            'Folygoizol 3 mm', 'Folygoizol 4 mm'
        ],
        Ruberoid: [
            'Ruberoid RKP-250 9m (Yupqa)', 'Ruberoid RKP-250 10m (Yupqa)',
            'Ruberoid RKP-250 15m (Yupqa)', 'Ruberoid RKP-300 9m (O\'rta)',
            'Ruberoid RKP-300 15m (O\'rta)', 'Ruberoid RKP-350 10m (Qalin)',
            'Ruberoid RKP-350 15m (Qalin)'
        ]
    };

    // API hooks
    const { data: products = [], isLoading: isCategoriesLoading } = useGetAllCategoriesQuery();
    const [createProduct, { isLoading: isCreatingProduct }] = useCreateCategoryMutation();
    const [updateProduct] = useUpdateCategoryMutation();
    const [deleteProduct] = useDeleteCategoryMutation();

    const { data: expenses = [], isLoading: isExpensesLoading } = useGetAllAdditionExpenQuery();
    const [createExpense, { isLoading: isCreatingExpense }] = useCreateAdditionExpenMutation();
    const [updateExpense] = useUpdateAdditionExpenMutation();

    // Update available products when category changes
    useEffect(() => {
        setAvailableProducts(productLists[productFormData.category] || []);
        setProductFormData(prev => ({ ...prev, productName: '' }));
    }, [productFormData.category]);

    // Show notification for products
    const showProductNotification = useCallback((message, type) => {
        setProductNotification({ message, type });
        setTimeout(() => setProductNotification({ message: '', type: '' }), 3000);
    }, []);

    // Show notification for expenses
    const showExpenseNotification = useCallback((message, type) => {
        setExpenseNotification({ message, type });
        setTimeout(() => setExpenseNotification({ message: '', type: '' }), 3000);
    }, []);

    // Handle product form input changes
    const handleProductInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setProductFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Handle expense form input changes
    const handleExpenseInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setExpenseFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Clear product form
    const clearProductForm = useCallback(() => {
        setProductFormData({
            category: '',
            productName: '',
            productionCost: '',
            loadingCost: ''
        });
        setProductEditId(null);
    }, []);

    // Clear expense form
    const clearExpenseForm = useCallback(() => {
        setExpenseFormData({
            saturdayWage: '',
        });
        setExpenseEditId(null);
    }, []);

    // Validate product form
    const validateProductForm = useCallback(() => {
        const { category, productName, productionCost, loadingCost } = productFormData;
        if (!category || !productName || !productionCost || !loadingCost) {
            showProductNotification("Barcha maydonlarni to'ldiring!", 'error');
            return false;
        }
        if (isNaN(parseFloat(productionCost)) || isNaN(parseFloat(loadingCost))) {
            showProductNotification("Narxlar raqam bo'lishi kerak!", 'error');
            return false;
        }
        return true;
    }, [productFormData, showProductNotification]);

    // Validate expense form
    const validateExpenseForm = useCallback(() => {
        const { saturdayWage } = expenseFormData;
        if (!saturdayWage) {
            showExpenseNotification("Barcha maydonlarni to'ldiring!", 'error');
            return false;
        }
        if (
            isNaN(parseFloat(saturdayWage))
        ) {
            showExpenseNotification("Barcha qiymatlar raqam bo'lishi kerak!", 'error');
            return false;
        }
        return true;
    }, [expenseFormData, showExpenseNotification]);

    // Handle product submission (create or update)
    const handleProductSubmit = useCallback(async () => {
        if (!validateProductForm()) return;

        const productData = {
            name: productFormData.productName,
            category: productFormData.category,
            productionCost: parseFloat(productFormData.productionCost),
            loadingCost: parseFloat(productFormData.loadingCost),
            createdAt: productEditId ? undefined : new Date().toLocaleDateString('uz-UZ')
        };

        try {
            if (productEditId) {
                await updateProduct({ id: productEditId, ...productData }).unwrap();
                showProductNotification('Mahsulot muvaffaqiyatli yangilandi!', 'success');
            } else {
                await createProduct(productData).unwrap();
                showProductNotification('Mahsulot muvaffaqiyatli qo\'shildi!', 'success');
            }
            clearProductForm();
        } catch (error) {
            showProductNotification(`Mahsulot ${productEditId ? 'yangilashda' : 'qo\'shishda'} xatolik yuz berdi!`, 'error');
        }
    }, [productFormData, productEditId, createProduct, updateProduct, showProductNotification, clearProductForm, validateProductForm]);

    // Handle expense submission (create or update)
    const handleExpenseSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!validateExpenseForm()) return;

        // Check if expense already exists (prevent duplicate creation)
        const existingExpense = expenses?.innerData?.find(exp =>
            exp.saturdayWage === parseFloat(expenseFormData.saturdayWage)
        );

        if (!expenseEditId && existingExpense) {
            showExpenseNotification("Bu xarajatlar allaqachon mavjud!", 'error');
            return;
        }

        const expenseData = {
            saturdayWage: parseFloat(expenseFormData.saturdayWage),
        };

        try {
            if (expenseEditId) {
                await updateExpense({ id: expenseEditId, ...expenseData }).unwrap();
                showExpenseNotification('Xarajatlar muvaffaqiyatli yangilandi!', 'success');
            } else {
                await createExpense(expenseData).unwrap();
                showExpenseNotification('Xarajatlar muvaffaqiyatli qo\'shildi!', 'success');
            }
            clearExpenseForm();
        } catch (error) {
            showExpenseNotification(`Xarajatlar ${expenseEditId ? 'yangilashda' : 'qo\'shishda'} xatolik yuz berdi!`, 'error');
        }
    }, [expenseFormData, expenseEditId, createExpense, updateExpense, showExpenseNotification, clearExpenseForm, validateExpenseForm, expenses]);

    // Handle edit product
    const handleEditProduct = useCallback((product) => {
        setProductFormData({
            category: product.category,
            productName: product.name,
            productionCost: product.productionCost.toString(),
            loadingCost: product.loadingCost.toString()
        });
        setProductEditId(product._id);
    }, []);

    // Handle edit expense
    const handleEditExpense = useCallback((expense) => {
        setExpenseFormData({
            saturdayWage: expense.saturdayWage.toString()
        });
        setExpenseEditId(expense._id);
    }, []);

    // Handle delete product
    const handleDeleteProduct = useCallback(async (id) => {
        if (!window.confirm("Bu mahsulotni o'chirishni xohlaysizmi?")) return;

        try {
            await deleteProduct(id).unwrap();
            showProductNotification("Mahsulot o'chirildi!", 'success');
        } catch (error) {
            showProductNotification("Mahsulot o'chirishda xatolik yuz berdi!", 'error');
        }
    }, [deleteProduct, showProductNotification]);

    // Handle product Enter key press
    const handleProductKeyPress = useCallback((e) => {
        if (e.key === 'Enter') handleProductSubmit();
    }, [handleProductSubmit]);

    // Handle expense Enter key press
    const handleExpenseKeyPress = useCallback((e) => {
        if (e.key === 'Enter') handleExpenseSubmit(e);
    }, [handleExpenseSubmit]);

    // Format createdAt to "YYYY.MM.DD HH:MM"
    const formatCreatedAt = useCallback((createdAt) => {
        const date = new Date(createdAt);
        const year = date.getFullYear().toString().padStart(4, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}.${month}.${day} ${hours}:${minutes}`;
    }, []);

    return (
        <div className="hyu-container">
            <div className="hyu-main-wrapper">
                {/* Form Section */}
                <div className="hyu-form-section">
                    <h2 className="hyu-table-title">
                        {productEditId ? 'Mahsulotni Yangilash' : 'Yangi Mahsulot Qo\'shish'}
                    </h2>


                    <div className="hyu-form-elem">
                        <div className="hyu-form-group">
                            <label className="hyu-label">Kategoriya</label>
                            <select
                                name="category"
                                className="hyu-select"
                                value={productFormData.category}
                                onChange={handleProductInputChange}
                                disabled={isCategoriesLoading}
                            >
                                <option value="">Kategoriyani tanlang</option>
                                {Object.keys(productLists).map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div className="hyu-form-group">
                            <label className="hyu-label">Mahsulot Nomi</label>
                            <select
                                name="productName"
                                className="hyu-select"
                                value={productFormData.productName}
                                onChange={handleProductInputChange}
                                disabled={!productFormData.category || !availableProducts.length}
                            >
                                <option value="">Mahsulot nomini tanlang</option>
                                {availableProducts.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="hyu-form-group">
                            <label className="hyu-label">Ishlab Chiqarish Narxi (UZS)</label>
                            <input
                                type="number"
                                name="productionCost"
                                className="hyu-input"
                                placeholder="Masalan: 50000"
                                value={productFormData.productionCost}
                                onChange={handleProductInputChange}
                                onKeyPress={handleProductKeyPress}
                            />
                        </div>

                        <div className="hyu-form-group">
                            <label className="hyu-label">Yuklash Narxi (UZS)</label>
                            <input
                                type="number"
                                name="loadingCost"
                                className="hyu-input"
                                placeholder="Masalan: 5000"
                                value={productFormData.loadingCost}
                                onChange={handleProductInputChange}
                                onKeyPress={handleProductKeyPress}
                            />
                        </div>

                        <div className="hyu-form-actions">
                            <button
                                type="button"
                                className="hyu-submit-btn"
                                onClick={handleProductSubmit}
                                disabled={isCreatingProduct}
                            >
                                {productEditId ? 'Yangilash' : 'Qo\'shish'}
                            </button>
                            {productEditId && (
                                <button
                                    type="button"
                                    className="hyu-cancel-btn"
                                    onClick={clearProductForm}
                                >
                                    Bekor qilish
                                </button>
                            )}
                        </div>
                    </div>

                    <br />

                    <div className="hyu-additional">
                        <h2 className="hyu-table-title">
                            {expenseEditId ? 'Xarajatlarni Yangilash' : 'Tannarx va boshqa xarajatlar'}
                        </h2>

                        <div className="hyu-f-result">
                            {expenses?.innerData?.length === 0 ? (
                                <div className="hyu-empty-state">
                                    <p>Hozircha xarajatlar yo'q</p>
                                </div>
                            ) : (
                                <div className="hyu-expense-list">
                                    {expenses?.innerData?.map((expense, index) => (
                                        <div key={index} className="hyu-expense-item">
                                            <div className="hyu-expense-field">
                                                <span className="hyu-label">Shanbalik Ish Haqi:</span>
                                                <span className='hyu-expense-label'>{expense.saturdayWage.toLocaleString()} so'm</span>
                                            </div>
                                            {/* <div className="hyu-expense-field">
                                                <span className="hyu-label">Davriy Xarajatlar:</span>
                                                <span className='hyu-expense-label'>{expense.periodicExpenses}%</span>
                                            </div>
                                            <div className="hyu-expense-field">
                                                <span className="hyu-label">Qo'shimcha Xarajatlar:</span>
                                                <span className='hyu-expense-label'>{expense.additionalExpenses}%</span>
                                            </div> */}
                                            <div className="hyu-expense-actions">
                                                <button
                                                    className="hyu-edit-btn"
                                                    onClick={() => handleEditExpense(expense)}
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <form className="hyu-form" onSubmit={handleExpenseSubmit}>
                            <div className="hyu-form-group">
                                <label className="hyu-label">Shanba Ish Haqi (UZS)</label>
                                <input
                                    type="number"
                                    name="saturdayWage"
                                    className="hyu-input"
                                    placeholder="Masalan: 50000"
                                    value={expenseFormData.saturdayWage}
                                    onChange={handleExpenseInputChange}
                                    onKeyPress={handleExpenseKeyPress}
                                    disabled={isExpensesLoading}
                                />
                            </div>

                            <div className="hyu-form-actions">
                                <button
                                    type="submit"
                                    className="hyu-submit-btn"
                                    disabled={isCreatingExpense || isExpensesLoading}
                                >
                                    {expenseEditId ? 'Yangilash' : 'Qo\'shish'}
                                </button>
                                {expenseEditId && (
                                    <button
                                        type="button"
                                        className="hyu-cancel-btn"
                                        onClick={clearExpenseForm}
                                    >
                                        Bekor qilish
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>


                </div>

                {/* Table Section */}
                <div className="hyu-table-section">
                    <h2 className="hyu-table-title">Mahsulotlar Jadvali</h2>
                    <div className="hyu-table-wrapper">
                        {products.length === 0 ? (
                            <div className="hyu-empty-state">
                                <p>Hozircha mahsulotlar yo'q</p>
                            </div>
                        ) : (
                            <table className="hyu-table">
                                <thead>
                                    <tr>
                                        <th>Nomi</th>
                                        <th>Kategoriya</th>
                                        <th>Ishlab Chiqarish</th>
                                        <th>Yuklash</th>
                                        <th>Sana</th>
                                        <th>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products?.innerData?.map((product) => (
                                        <tr key={product._id}>
                                            <td className="hyu-product-name">{product.name}</td>
                                            <td>
                                                <span className={`hyu-category-badge ${product.category.toLowerCase()}`}>
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="hyu-price">
                                                {product.productionCost.toLocaleString()} UZS
                                            </td>
                                            <td className="hyu-price">
                                                {product.loadingCost.toLocaleString()} UZS
                                            </td>
                                            <td className="hyu-date">{formatCreatedAt(product.createdAt)}</td>
                                            <td>
                                                <button
                                                    className="hyu-edit-btn"
                                                    onClick={() => handleEditProduct(product)}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="hyu-delete-btn"
                                                    onClick={() => handleDeleteProduct(product._id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {(productNotification.message || expenseNotification.message) && (
                <div className={`hyu-notification ${productNotification.message ? productNotification.type : expenseNotification.type} show`}>
                    {productNotification.message || expenseNotification.message}
                </div>
            )}
        </div>
    );
};

export default CatigoryManagement;



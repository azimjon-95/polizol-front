import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { useGetFilteredMaterialsQuery } from '../../../context/materialApi';
import { NumberFormat } from '../../../hook/NumberFormat';
import { GiOilDrum } from "react-icons/gi";
import { TbNeedleThread } from "react-icons/tb";
import { FaIndustry, FaFlask } from 'react-icons/fa';
import { useCreateBn5ProductionMutation } from '../../../context/productionApi';
import { Button } from 'antd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './style.css';
import Bn5ProcessDialog from './Bn5ProcessDialog';

const BitumProductionSystem = () => {
  const [showBn3Dialog, setShowBn3Dialog] = useState(false);
  const [calculatedBn5, setCalculatedBn5] = useState(0);
  const [actualBn5Result, setActualBn5Result] = useState('');
  const [createBn5Production, {
    isLoading: createBn5ProductionLoading
  }] = useCreateBn5ProductionMutation();
  const { data: material, refetch, isLoading, isFetching } = useGetFilteredMaterialsQuery();


  const [currentBn3Production, setCurrentBn3Production] = useState({
    id: null,
    date: new Date().toISOString().split('T')[0],
    bn3Amount: '15000',
    wasteAmount: '500',
    gasAmount: '800',
    temperature: '250',
    electricEnergy: '14.5',
    boilingHours: '12',
    notes: '',
    electricity: '500',
    price: '',
    extra: '713545',
  });

  const electricityPrice = 1000;
  const gasPrice = 1800;
  const workers = [{ fullName: 'Akmal Qurbonov', salary: 750000 }];

  // Memoized material object for efficient lookup
  const materialObj = useMemo(
    () =>
      material?.filteredMaterials?.reduce((acc, item) => {
        acc[item.category.replace(/-/g, '').toLowerCase()] = item;
        return acc;
      }, {}) || {},
    [material]
  );

  // Memoized total workers' salary
  const totalWorkersSalary = useMemo(
    () => workers.reduce((sum, worker) => sum + worker.salary, 0),
    []
  );

  // Calculate BN-5 unit cost based on production inputs
  useEffect(() => {
    const { bn3Amount, wasteAmount, gasAmount, electricity, extra } = currentBn3Production;
    const bn3 = parseFloat(bn3Amount) || 0;
    const waste = parseFloat(wasteAmount) || 0;
    const gas = parseFloat(gasAmount) || 0;
    const electricityUsed = parseFloat(electricity) || 0;
    const extraCost = parseFloat(extra) || 0;
    const bn3Price = materialObj?.bn3?.price || 0;

    const totalBn3Cost = bn3 * bn3Price;
    const totalGasCost = gas * gasPrice;
    const totalElectricityCost = electricityUsed * electricityPrice;
    const mainCosts = totalBn3Cost + totalGasCost + totalElectricityCost + totalWorkersSalary;
    const totalCost = mainCosts + extraCost;
    const finalBn5 = bn3 - waste;
    const unitCostBn5 = finalBn5 > 0 ? Math.ceil(totalCost / finalBn5).toString() : '0';

    setCurrentBn3Production((prev) => ({ ...prev, price: unitCostBn5 }));
  }, [
    currentBn3Production.bn3Amount,
    currentBn3Production.wasteAmount,
    currentBn3Production.gasAmount,
    currentBn3Production.electricity,
    currentBn3Production.extra,
    materialObj.bn3?.price,
    totalWorkersSalary,
  ]);

  // Validate BN-3 production inputs
  const validateBn3Production = () => {
    const { bn3Amount } = currentBn3Production;
    const bn3 = parseFloat(bn3Amount) || 0;

    if ((materialObj?.bn3?.quantity || 0) < bn3) {
      toast.error("Omborida yetarli BN-3 yo'q!");
      return false;
    }
    return true;
  };

  // Handle BN-3 to BN-5 production
  const handleBn3Production = () => {
    if (!validateBn3Production()) return;
    const { bn3Amount, wasteAmount } = currentBn3Production;
    const bn3 = parseFloat(bn3Amount) || 0;
    const waste = parseFloat(wasteAmount) || 0;
    const finalBn5 = bn3 - waste;

    setCalculatedBn5(finalBn5);
    setShowBn3Dialog(true);
  };

  // Confirm BN-3 production and update backend
  const confirmBn3Production = async () => {
    try {
      const { bn3Amount, wasteAmount, gasAmount, temperature, electricEnergy, boilingHours, notes, electricity, extra, date, price } =
        currentBn3Production;

      const res = await createBn5Production({
        bn3Amount,
        wasteAmount,
        gasAmount,
        temperature,
        electricEnergy,
        boilingHours,
        notes,
        electricity,
        extra,
        date,
        price,
      });

      if (res?.data?.finalBn5) {
        toast.success(`BN-5 ishlab chiqarildi! Omborga ${res.data.finalBn5} kg qo'shildi`);
        refetch();
      }

      setActualBn5Result('');
      setShowBn3Dialog(false);
    } catch (error) {
      toast.error(error.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
    }
  };

  // Input fields configuration for BN-3 production
  const bn3InputFields = [
    { label: 'BN-3 miqdori (kg)', key: 'bn3Amount', placeholder: '15000' },
    { label: 'Chiqindi (kg)', key: 'wasteAmount', placeholder: '500' },
    {
      label: (
        <span>
          Elektr energiyasi (kWh) <span className="price-info">({electricityPrice} so‘m/kWh)</span>
        </span>
      ),
      key: 'electricity',
      placeholder: '1200',
    },
    {
      label: (
        <span>
          Gaz (m³) <span className="price-info">({gasPrice} so‘m/m³)</span>
        </span>
      ),
      key: 'gasAmount',
      placeholder: '4500',
    },
    { label: 'Boshqa xarajatlar', key: 'extra', placeholder: '5.850' },
    // { label: 'Qaynash vaqti (soat)', key: 'boilingHours', placeholder: '19' },
    { label: 'BN-5 (1kg narx)', key: 'price', placeholder: '10.000', readOnly: true },
  ];

  // Render BN-3 input fields
  const renderBn3InputFields = () =>
    bn3InputFields.map(({ label, key, placeholder, readOnly }) => (
      <div className="bitum-input-group" key={key}>
        <label>{label}</label>
        <input
          type="number"
          value={currentBn3Production[key]}
          onChange={(e) => !readOnly && setCurrentBn3Production({ ...currentBn3Production, [key]: e.target.value })}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
    ));

  // Loading component
  const LoadingSpinner = () => (
    <div className="bitum-loading-spinner">
      <p>Inventar ma'lumotlari yuklanmoqda...</p>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="bitum-system-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      {/* Inventory Grid with Loading State */}
      {isLoading || isFetching ? (
        <LoadingSpinner />
      ) : (
        <div className="bitum-inventory-grid">
          <div className="bitum-inventory-card">
            <h4><GiOilDrum style={{ marginRight: 5 }} /> BN-3 Ombori</h4>
            <p className="bn3-inventory">{(materialObj?.bn3?.quantity || 0).toLocaleString()} kg</p>
          </div>

          <div className="bitum-inventory-card">
            <h4><GiOilDrum style={{ marginRight: 5 }} /> BN-5 Ombori</h4>
            <p className="bn5-inventory">{(materialObj?.bn5?.quantity || 0).toLocaleString()} kg</p>
          </div>

          <div className="bitum-inventory-card">
            <h4><FaFlask style={{ marginRight: 5 }} /> Mel Ombori</h4>
            <p className="mel-inventory">{(materialObj?.mel?.quantity || 0).toLocaleString()} kg</p>
          </div>

          <div className="bitum-inventory-card">
            <h4><TbNeedleThread style={{ marginRight: 5 }} />Xomashyo Ombori</h4>
            <p className="ready-product-inventory">BN-5 Ip: {(materialObj?.ip?.quantity || 0).toLocaleString()} kg</p>
            <p className="ready-product-inventory">BN-5 Qop qog'oz: {(materialObj?.qop?.quantity || 0).toLocaleString()} dona</p>
            <p className="ready-product-inventory">BN-5 Kraf qog'oz: {(materialObj?.kraf?.quantity || 0).toLocaleString()} kg</p>
          </div>

          <div className="bitum-inventory-card">
            <h4><FaIndustry style={{ marginRight: 5 }} /> Tayyor Mahsulot</h4>
            {material?.bn?.length > 0 ? (
              material.bn?.filter((i) => i.isReturned !== true).map((val, inx) => (
                <p key={inx} className="ready-product-inventory">
                  {val.productName}: {NumberFormat(val.quantity)} kg
                </p>
              ))
            ) : (
              <p>Hozircha tayyor mahsulotlar yo‘q</p>
            )}
          </div>
        </div>

      )}

      <div className="bitum-production-sections">
        <div className="bitum-production-panel">
          <div className="bitum-panel-header">
            <Calculator size={24} color="#667eea" />
            <h2>1-BOSQICH: BN-3 → BN-5</h2>
          </div>
          <div className="bitum-input-grid">{renderBn3InputFields()}</div>
          <button className="bitum-action-button bitum-bn3-action" onClick={handleBn3Production}>
            <TrendingUp size={20} /> BN-5 Ishlab Chiqarish
          </button>
        </div>

        <Bn5ProcessDialog
          refetch={refetch}
          material={material?.filteredMaterials}
          gasPrice={gasPrice}
          electricityPrice={electricityPrice}
          materialObj={materialObj}
        />

      </div>

      {showBn3Dialog && (
        <div className="bitum-dialog-overlay">
          <div className="bitum-dialog-box">
            <h3>BN-5 Ishlab Chiqarish Natijasi</h3>
            <p> Hisoblangan BN-5 miqdori: <strong>{calculatedBn5.toLocaleString()} kg</strong></p>
            <div className="bitum-dialog-input">
              <label>Haqiqiy BN-5 miqdori (kg)</label>
              <input
                type="number"
                value={actualBn5Result}
                onChange={(e) => setActualBn5Result(e.target.value)}
                placeholder={calculatedBn5.toLocaleString()}
              />
            </div>
            <div className="bitum-dialog-actions">
              <button className="bitum-cancel-button" onClick={() => setShowBn3Dialog(false)}>
                Bekor qilish
              </button>
              <Button
                className="bitum-confirm-button bitum-bn3-confirm"
                onClick={confirmBn3Production}
                disabled={createBn5ProductionLoading}
                loading={createBn5ProductionLoading}
              >
                Tasdiqlash
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BitumProductionSystem;
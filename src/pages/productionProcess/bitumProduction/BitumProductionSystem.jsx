import React, { useMemo } from "react";
import { useGetFilteredMaterialsQuery } from "../../../context/materialApi";
import { NumberFormat } from "../../../hook/NumberFormat";

import { GiOilDrum } from "react-icons/gi";
import { TbNeedleThread } from "react-icons/tb";
import { FaIndustry, FaFlask } from "react-icons/fa";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./style.css";
import Bn5ProcessDialog from "./Bn5ProcessDialog";
import Bn3Production from "./useBn3ProductionForm"; // ✅ to‘g‘ri import (file nomi shu bo‘lsin)

const BitumProductionSystem = () => {
  const { data: material, refetch, isLoading, isFetching } =
    useGetFilteredMaterialsQuery();

  // Bn5ProcessDialog ichida ishlatyapsiz — shuning uchun qoldirdim
  const electricityPrice = 1000;
  const gasPrice = 1800;

  const materialObj = useMemo(
    () =>
      material?.filteredMaterials?.reduce((acc, item) => {
        acc[item.category.replace(/-/g, "").toLowerCase()] = item;
        return acc;
      }, {}) || {},
    [material]
  );

  const LoadingSpinner = () => (
    <div className="bitum-loading-spinner">
      <p>Inventar ma'lumotlari yuklanmoqda...</p>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="bitum-system-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {isLoading || isFetching ? (
        <LoadingSpinner />
      ) : (
        <div className="bitum-inventory-grid">
          <div className="bitum-inventory-card">
            <h4>
              <GiOilDrum style={{ marginRight: 5 }} /> BN-3 Ombori
            </h4>
            <p className="bn3-inventory">
              {(materialObj?.bn3?.quantity || 0).toLocaleString()} kg
            </p>
          </div>

          <div className="bitum-inventory-card">
            <h4>
              <GiOilDrum style={{ marginRight: 5 }} /> BN-5 Ombori
            </h4>
            <p className="bn5-inventory">
              {(materialObj?.bn5?.quantity || 0).toLocaleString()} kg
            </p>
          </div>

          <div className="bitum-inventory-card">
            <h4>
              <FaFlask style={{ marginRight: 5 }} /> Mel Ombori
            </h4>
            <p className="mel-inventory">
              {(materialObj?.mel?.quantity || 0).toLocaleString()} kg
            </p>
          </div>

          <div className="bitum-inventory-card">
            <h4>
              <TbNeedleThread style={{ marginRight: 5 }} /> Xomashyo Ombori
            </h4>
            <p className="ready-product-inventory">
              BN-5 Ip: {(materialObj?.ip?.quantity || 0).toLocaleString()} kg
            </p>
            <p className="ready-product-inventory">
              BN-5 Qop qog'oz: {(materialObj?.qop?.quantity || 0).toLocaleString()} dona
            </p>
            <p className="ready-product-inventory">
              BN-5 Kraf qog'oz: {(materialObj?.kraf?.quantity || 0).toLocaleString()} kg
            </p>
          </div>

          <div className="bitum-inventory-card">
            <h4>
              <FaIndustry style={{ marginRight: 5 }} /> Tayyor Mahsulot
            </h4>

            {material?.bn?.length > 0 ? (
              material.bn
                ?.filter((i) => i.isReturned !== true)
                .map((val, idx) => (
                  <p key={idx} className="ready-product-inventory">
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
        {/* ✅ BN-3 bosqichi endi to‘liq komponent ichida */}
        <Bn3Production />

        {/* BN-5 process dialog sizda prop bilan ishlaydi */}
        <Bn5ProcessDialog
          refetch={refetch}
          material={material?.filteredMaterials}
          gasPrice={gasPrice}
          electricityPrice={electricityPrice}
          materialObj={materialObj}
        />
      </div>
    </div>
  );
};

export default BitumProductionSystem;







// import React from 'react';
// import { GiOilDrum } from "react-icons/gi";
// import { TbNeedleThread } from "react-icons/tb";
// import { FaIndustry, FaFlask } from 'react-icons/fa';
// import { useGetFilteredMaterialsQuery } from '../../../context/materialApi';
// import { NumberFormat } from '../../../hook/NumberFormat';
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import './style.css';
// import Bn3ToBn5Production from './Bn3ToBn5Production';
// import Bn5ProcessDialog from './Bn5ProcessDialog';

// const BitumProductionSystem = () => {
//   const { data: material, refetch, isLoading, isFetching } = useGetFilteredMaterialsQuery();

//   // Materiallarni category bo'yicha qulay obyektga aylantirish
//   const materialObj = React.useMemo(() => {
//     if (!material?.filteredMaterials) return {};
//     return material.filteredMaterials.reduce((acc, item) => {
//       acc[item.category.replace(/-/g, '').toLowerCase()] = item;
//       return acc;
//     }, {});
//   }, [material]);

//   const LoadingSpinner = () => (
//     <div className="bitum-loading-spinner">
//       <p>Inventar ma'lumotlari yuklanmoqda...</p>
//       <div className="spinner"></div>
//     </div>
//   );

//   return (
//     <div className="bitum-system-container">
//       <ToastContainer
//         position="top-right"
//         autoClose={3000}
//         hideProgressBar={false}
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//       />

//       {/* Inventory Grid */}
//       {isLoading || isFetching ? (
//         <LoadingSpinner />
//       ) : (
//         <div className="bitum-inventory-grid">
//           <div className="bitum-inventory-card">
//             <h4><GiOilDrum style={{ marginRight: 5 }} /> BN-3 Ombori</h4>
//             <p className="bn3-inventory">
//               {(materialObj?.bn3?.quantity || 0).toLocaleString()} kg
//             </p>
//           </div>

//           <div className="bitum-inventory-card">
//             <h4><GiOilDrum style={{ marginRight: 5 }} /> BN-5 Ombori</h4>
//             <p className="bn5-inventory">
//               {(materialObj?.bn5?.quantity || 0).toLocaleString()} kg
//             </p>
//           </div>

//           <div className="bitum-inventory-card">
//             <h4><FaFlask style={{ marginRight: 5 }} /> Mel Ombori</h4>
//             <p className="mel-inventory">
//               {(materialObj?.mel?.quantity || 0).toLocaleString()} kg
//             </p>
//           </div>

//           <div className="bitum-inventory-card">
//             <h4><TbNeedleThread style={{ marginRight: 5 }} /> Xomashyo Ombori</h4>
//             <p className="ready-product-inventory">
//               BN-5 Ip: {(materialObj?.ip?.quantity || 0).toLocaleString()} kg
//             </p>
//             <p className="ready-product-inventory">
//               BN-5 Qop qog'oz: {(materialObj?.qop?.quantity || 0).toLocaleString()} dona
//             </p>
//             <p className="ready-product-inventory">
//               BN-5 Kraf qog'oz: {(materialObj?.kraf?.quantity || 0).toLocaleString()} kg
//             </p>
//           </div>

//           <div className="bitum-inventory-card">
//             <h4><FaIndustry style={{ marginRight: 5 }} /> Tayyor Mahsulot</h4>
//             {material?.bn?.length > 0 ? (
//               material.bn
//                 .filter((i) => !i.isReturned)
//                 .map((val, inx) => (
//                   <p key={inx} className="ready-product-inventory">
//                     {val.productName}: {NumberFormat(val.quantity)} kg
//                   </p>
//                 ))
//             ) : (
//               <p>Hozircha tayyor mahsulotlar yo‘q</p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Production Processes */}
//       <div className="bitum-production-sections">
//         <Bn3ToBn5Production refetch={refetch} materialObj={materialObj} />

//         <Bn5ProcessDialog
//           refetch={refetch}
//           material={material?.filteredMaterials}
//           materialObj={materialObj}
//         />
//       </div>
//     </div>
//   );
// };

// export default BitumProductionSystem;
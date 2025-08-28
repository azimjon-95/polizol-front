import React, { useState } from 'react';
import { Phone, MapPin, Building, Instagram } from 'lucide-react';
import { FaTelegram } from "react-icons/fa";
import Logo from '../../../assets/polizolLogo.png'
import { useGetFactoriesQuery } from '../../../context/clinicApi'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './style.css';

const CompanyInfoPage = ({ onShowFeedback }) => {
    return (
        <div className="feedback-page-container">
            <div className="company-info-section">
                <div className="company-header">
                    <img width={200} src={Logo} alt="" />
                    <h1 className="company-title">"SELEN BUNYODKOR" MCHJ</h1>
                </div>

                <div className="company-details">
                    <div className="info-item">
                        <MapPin className="info-icon" />
                        <div>
                            <h3>Manzil</h3>
                            <p>Namangan viloyati, Pop tumani, Chinor MFY, Istiqilol 18</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <Phone className="info-icon" />
                        <div>
                            <h3>Telefon raqamlar</h3>
                            <p></p>
                            <p>+998 94 184 10 00</p>
                            <div className="social-links">
                                <a href="https://t.me/PopPolizol" target="_blank" rel="noopener noreferrer">
                                    <FaTelegram className="social-icon" />
                                </a>
                                <a href="https://www.instagram.com/poppolizol_uz?igsh=c29zeDVkbGdiODIz" target="_blank" rel="noopener noreferrer">
                                    <Instagram className="social-icon" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="info-item">
                        <Building className="info-icon" />
                        <div>
                            <h3>Faoliyat</h3>
                            <p>Bitum va ko'mir qog'oz ishlab chiqarish</p>
                            <p>Qurilish materiallari yetkazib berish</p>
                        </div>
                    </div>
                </div>

                <div className="company-description">
                    <h3>Biz haqimizda</h3>
                    <p>
                        "SELEN BUNYODKOR" MCHJ 2013-yilda Namangan viloyatida tashkil etilgan bo'lib, Pop Polizol brendi ostida yuqori sifatli qurilish materiallari ishlab chiqarish va yetkazib berish bo'yicha yetakchi kompaniyalardan biridir. Bizning mahsulotlarimiz:
                    </p>
                    <ul className="list-disc pl-5">
                        <li>Poliizol</li>
                        <li>Folgoizol</li>
                        <li>Ruberoid</li>
                        <li>Bitum BN-5</li>
                        <li>Praymer - BIPRO</li>
                    </ul>
                    <p>
                        Biz mijozlarimizga eng yuqori sifatli mahsulotlar va professional xizmatlarni taqdim etishga intilamiz. Sizning fikr-mulohazalaringiz biz uchun muhim – xizmatlarimizni yaxshilash uchun taklif va shikoyatlaringizni qabul qilamiz!
                    </p>
                </div>

            </div>

            <button
                onClick={onShowFeedback}
                className="feedback-toggle-btn"
            >
                Taklif va Shikoyat Yuborish
            </button>
        </div>
    );
};

const FeedbackForm = ({ onSubmit, onBack }) => {
    //useGetFactoriesQuery
    const { data } = useGetFactoriesQuery();

    const [feedback, setFeedback] = useState({
        name: '',
        phone: '',
        message: '',
        rating: 5,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFeedback(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!feedback.name || !feedback.phone || !feedback.message) {
            toast.error("Iltimos, barcha maydonlarni to'ldiring!", {
                position: 'top-right',
                autoClose: 3000,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const botToken = '8090474968:AAFGRIUPCEf9deS5-0rZZ4iNDefL4Dpuoww';
            const chatId = '-889794900'; // Guruh chatId
            const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

            const messageText = `📝 *Yangi taklif/shikoyat:*\n\n👤 Ism/Firma: ${feedback.name}\n📞 Telefon: ${feedback.phone}\n⭐ Baho: ${feedback.rating}/5\n💬 Xabar: ${feedback.message}\n🕒 Vaqt: ${new Date().toLocaleString('uz-UZ')}`;

            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: messageText,
                    parse_mode: 'Markdown'
                }),
            });

            if (response.ok) {
                toast.success('Xabar muvaffaqiyatli yuborildi!', {
                    position: 'top-right',
                    autoClose: 3000,
                });
                setIsSubmitted(true);
                setFeedback({ name: '', phone: '', message: '', rating: 5 });
            } else {
                throw new Error('Telegram API error');
            }
        } catch (error) {
            toast.error('Xabar yuborishda xatolik yuz berdi!', {
                position: 'top-right',
                autoClose: 3000,
            });
            console.error('Error sending message to Telegram:', error);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isSubmitted) {
        return (
            <div className="feedback-success">
                <div className="success-icon">✓</div>
                <h3>Rahmat!</h3>
                <p>Sizning taklifingiz muvaffaqiyatli yuborildi.</p>
                <p>Tez orada siz bilan bog'lanamiz.</p>
                <button onClick={onBack} className="back-to-info-btn">
                    Orqaga qaytish
                </button>
            </div>
        );
    }

    return (
        <div className="feedback-form-container">


            <h2 className="doc-title">Taklif va Shikoyatlar</h2>
            <p className="feedback-subtitle">
                Sizning fikringiz biz uchun muhim. Xizmatlarimizni yaxshilash uchun
                takliflaringizni yuboring.
            </p>

            <form onSubmit={handleSubmit} className="feedback-form">
                <div className="form-group">
                    <label htmlFor="name">Ism yoki Firma Nomi *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={feedback.name}
                        onChange={handleInputChange}
                        placeholder="Ismingizni yoki firma nomini kiriting"
                        className="sacod-input"
                        required
                        aria-label="Name or Company Name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Telefon Raqami *</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={feedback.phone}
                        onChange={handleInputChange}
                        placeholder="+998 94 184 10 00"
                        className="sacod-input"
                        required
                        aria-label="Phone Number"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="rating">Xizmat sifatini baholang</label>
                    <select
                        id="rating"
                        name="rating"
                        value={feedback.rating}
                        onChange={handleInputChange}
                        className="sacod-input rating-select"
                        aria-label="Service Rating"
                    >
                        <option value={5}>5 - A'lo</option>
                        <option value={4}>4 - Yaxshi</option>
                        <option value={3}>3 - O'rta</option>
                        <option value={2}>2 - Yomon</option>
                        <option value={1}>1 - Juda yomon</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="message">Xabar *</label>
                    <textarea
                        id="message"
                        name="message"
                        value={feedback.message}
                        onChange={handleInputChange}
                        placeholder="Sizning taklif yoki shikoyatingiz"
                        className="sacod-textarea"
                        rows="4"
                        required
                        aria-label="Feedback Message"
                    />
                </div>

                <button
                    type="submit"
                    className="sacod-submit-btn"
                    disabled={isSubmitting}
                    aria-label="Submit feedback"
                >
                    {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
                </button>
                <button onClick={onBack} className="back-btn">
                    ← Orqaga
                </button>
            </form>
        </div>
    );
};

const QRFeedbackPage = () => {
    const [showFeedback, setShowFeedback] = useState(false);

    return (
        <div className="qr-feedback-page">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick draggable pauseOnHover />
            {!showFeedback ? (
                <CompanyInfoPage onShowFeedback={() => setShowFeedback(true)} />
            ) : (
                <FeedbackForm
                    onSubmit={() => setShowFeedback(false)}
                    onBack={() => setShowFeedback(false)}
                />
            )}
        </div>
    );
};

export default QRFeedbackPage;
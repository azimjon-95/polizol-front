import axios from 'axios';
import { message } from 'antd';

export const handleUpload = async ({ file, setUploading }) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', process.env.REACT_APP_IMGBB_API_KEY || '7d0e5cda4c0a69b73c6ea854e71807dd');
    setUploading(true);
    try {
        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data.url;
    } catch (error) {
        message.error(`Logotipni yuklashda xatolik: ${error.response?.data?.error?.message || error.message}`);
        throw error;
    } finally {
        setUploading(false);
    }
};
import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userMode, setUserMode] = useState('individual'); // 'individual' veya 'institutional'

  const loginSchema = Yup.object().shape({
    email: Yup.string().email('Geçersiz email').required('Zorunlu alan'),
    password: Yup.string().min(6, 'En az 6 karakter').required('Zorunlu alan'),
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">PromptGuard</h2>
        
        {/* Mod Seçimi */}
        <div className="flex mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 rounded-md transition-all ${userMode === 'individual' ? 'bg-white shadow-sm text-purple-600 font-semibold' : 'text-gray-500'}`}
            onClick={() => setUserMode('individual')}
          >
            Bireysel
          </button>
          <button
            className={`flex-1 py-2 rounded-md transition-all ${userMode === 'institutional' ? 'bg-white shadow-sm text-purple-600 font-semibold' : 'text-gray-500'}`}
            onClick={() => setUserMode('institutional')}
          >
            Kurumsal
          </button>
        </div>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={(values) => {
            console.log('Login attempt:', { ...values, mode: userMode });
            // Burada api.post('/auth/login', ...) çağrısı yapılacak
            // Test amaçlı: Gerçek bir backend yoksa bile giriş yapılmış gibi davranalım
            const mockToken = "dummy-jwt-token";
            const userData = { email: values.email, mode: userMode };
            
            login(mockToken, userData); // Context'e veriyi yazıyoruz
            console.log("Giriş yapıldı:", userData);
            // Başarılı girişi takiben Sohbet sayfasına yönlendir [cite: 58]
            navigate('/chat');
          }}
        >
          {({ errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">E-posta</label>
                <Field name="email" type="email" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                {errors.email && touched.email && <div className="text-red-500 text-xs mt-1 text-left">{errors.email}</div>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Şifre</label>
                <Field name="password" type="password" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                {errors.password && touched.password && <div className="text-red-500 text-xs mt-1 text-left">{errors.password}</div>}
              </div>

              <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors mt-6">
                Giriş Yap
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;
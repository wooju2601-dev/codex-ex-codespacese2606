import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('user');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      await register(email, password, userType);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="mx-auto w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">회원가입</h1>
        <p className="mt-1 text-sm text-slate-500">사용자 유형을 선택해 프로필을 생성합니다.</p>
      </div>

      <input
        className="input"
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <input
        className="input"
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={6}
      />

      <select className="input" value={userType} onChange={(event) => setUserType(event.target.value)}>
        <option value="user">일반 사용자</option>
        <option value="dealer">딜러</option>
      </select>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button className="primary-button w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={submitting}>
        {submitting ? '가입 중...' : '가입하기'}
      </button>

      <button className="w-full text-sm font-semibold text-blue-700 hover:text-blue-900" type="button" onClick={onSwitchToLogin}>
        이미 계정이 있으면 로그인
      </button>
    </form>
  );
}

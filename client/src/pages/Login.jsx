import { useState } from 'react';
import { browserLocalPersistence, setPersistence, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    if (!auth) {
      setError('Firebase 환경변수를 client/.env에 설정해 주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="mx-auto w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">로그인</h1>
        <p className="mt-1 text-sm text-slate-500">이메일과 비밀번호로 로그인합니다.</p>
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
      />

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button className="primary-button w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={submitting}>
        {submitting ? '로그인 중...' : '로그인'}
      </button>

      <button className="w-full text-sm font-semibold text-blue-700 hover:text-blue-900" type="button" onClick={onSwitchToRegister}>
        계정이 없으면 회원가입
      </button>
    </form>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiUrl } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

const labels = {
  type: '차종',
  fuel: '연료',
  mileage: '주행거리',
  location: '지역',
};

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    const loadCar = async () => {
      try {
        const response = await fetch(apiUrl(`/api/cars/${id}`));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '차량 정보를 불러오지 못했습니다.');
        }

        setCar(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadCar();
  }, [id]);

  const startConsultation = async () => {
    if (!user) {
      setError('로그인 후 상담할 수 있습니다.');
      return;
    }

    try {
      setCreatingRoom(true);
      setError('');

      const response = await fetch(apiUrl('/api/chat-rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car._id,
          carName: car.name,
          userId: user.uid,
          dealerId: car.dealerId,
          dealerName: car.dealerName,
        }),
      });
      const room = await response.json();

      if (!response.ok) {
        throw new Error(room.message || '상담방을 만들지 못했습니다.');
      }

      navigate(`/chat/${room._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreatingRoom(false);
    }
  };

  if (loading || authLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50">차량 정보를 불러오는 중입니다.</main>;
  }

  if (error && !car) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <p className="text-red-700">{error}</p>
        <Link className="secondary-button" to="/">목록으로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <article className="mx-auto max-w-5xl overflow-hidden rounded-xl bg-white shadow-lg">
        <img className="h-72 w-full object-cover md:h-[440px]" src={apiUrl(car.imageUrl)} alt={`${car.name} 차량`} />

        <div className="p-6 md:p-8">
          <Link className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" to="/">
            <ArrowLeft size={17} />
            차량 목록
          </Link>

          <p className="text-sm font-bold text-blue-700">{car.company}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{car.name}</h1>
          <p className="mt-3 text-2xl font-bold text-emerald-700">{car.price.toLocaleString()}만원</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="제조사" value={car.company} />
            <DetailItem label="연식" value={`${car.year}년`} />
            {Object.entries(labels).map(([key, label]) => (
              <DetailItem
                key={key}
                label={label}
                value={key === 'mileage' ? `${car[key]?.toLocaleString() || 0}km` : car[key]}
              />
            ))}
            <DetailItem label="딜러" value={car.dealerName} />
          </div>

          <section className="mt-7 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-bold text-slate-950">차량 설명</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{car.description || '등록된 설명이 없습니다.'}</p>
          </section>

          {error && <p className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button
            className="primary-button mt-7 w-full bg-blue-600 py-3 hover:bg-blue-700"
            type="button"
            onClick={startConsultation}
            disabled={creatingRoom}
          >
            <MessageCircle size={19} />
            {creatingRoom ? '상담방 만드는 중...' : '딜러와 상담하기'}
          </button>
        </div>
      </article>
    </main>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value || '-'}</p>
    </div>
  );
}

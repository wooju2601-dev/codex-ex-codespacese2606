import { useEffect, useState } from 'react';
import {
  Building2,
  Car,
  Check,
  Gauge,
  LogOut,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiUrl } from './config.js';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const emptyForm = {
  name: '',
  company: '',
  price: '',
  year: '',
  type: 'sedan',
  fuel: 'gasoline',
  mileage: '',
  location: '',
  description: '',
  dealerName: '',
};

const emptySearch = {
  keyword: '',
  company: '',
  minPrice: '',
  maxPrice: '',
  minYear: '',
  maxYear: '',
};

function App() {
  const { user, userProfile, loading, logout, isConfigured } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState(emptySearch);
  const [message, setMessage] = useState('');

  const totalPrice = cars.reduce((sum, car) => sum + car.price, 0);
  const averagePrice = cars.length ? Math.round(totalPrice / cars.length) : 0;
  const newestYear = cars.length ? Math.max(...cars.map((car) => car.year)) : '-';
  const companyCount = new Set(cars.map((car) => car.company)).size;

  const loadCars = async () => {
    const response = await fetch(apiUrl('/cars'));
    const data = await response.json();
    setCars(data);
    setMessage('전체 목록을 불러왔습니다.');
  };

  useEffect(() => {
    if (user) {
      loadCars();
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImage(null);
    setFileInputKey((currentKey) => currentKey + 1);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isEditing = Boolean(editingId);
    try {
      if (isEditing) {
        const response = await fetch(apiUrl(`/cars/${editingId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            company: form.company.toUpperCase(),
            price: Number(form.price),
            year: Number(form.year),
            type: form.type,
            fuel: form.fuel,
            mileage: Number(form.mileage),
            location: form.location,
            description: form.description,
            dealerName: form.dealerName,
          }),
        });

        if (!response.ok) {
          throw new Error('자동차 수정에 실패했습니다.');
        }

        resetForm();
        await loadCars();
        setMessage('자동차 정보를 수정했습니다.');
        return;
      }

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('company', form.company);
      formData.append('price', form.price);
      formData.append('year', form.year);
      formData.append('type', form.type);
      formData.append('fuel', form.fuel);
      formData.append('mileage', form.mileage);
      formData.append('location', form.location);
      formData.append('description', form.description);
      formData.append('dealerId', user.uid);
      formData.append('dealerName', form.dealerName);
      formData.append('image', image);

      const response = await fetch(apiUrl('/api/cars'), {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '자동차 등록에 실패했습니다.');
      }

      setCars((currentCars) => [data, ...currentCars]);
      resetForm();
      setMessage('새 자동차와 사진을 MongoDB에 등록했습니다.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleEdit = (car) => {
    setEditingId(car._id);
    setForm({
      name: car.name,
      company: car.company,
      price: String(car.price),
      year: String(car.year),
      type: car.type || 'sedan',
      fuel: car.fuel || 'gasoline',
      mileage: String(car.mileage || ''),
      location: car.location || '',
      description: car.description || '',
      dealerName: car.dealerName || '',
    });
    setMessage(`${car.name} 수정 모드입니다.`);
  };

  const handleDelete = async (id) => {
    await fetch(apiUrl(`/cars/${id}`), { method: 'DELETE' });
    await loadCars();
    setMessage('자동차를 삭제했습니다.');
  };

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    setSearch({ ...search, [name]: value });
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const params = new URLSearchParams();

    Object.entries(search).forEach(([key, value]) => {
      if (value.trim()) {
        params.append(key, value.trim());
      }
    });

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(apiUrl(`/api/cars/search${query}`));
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || '검색에 실패했습니다.');
      return;
    }

    setCars(data);
    setMessage(`검색 결과 ${data.length}대를 찾았습니다.`);
  };

  const resetSearch = async () => {
    setSearch(emptySearch);
    await loadCars();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        로그인 상태를 확인하는 중입니다.
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full">
          {!isConfigured && (
            <div className="mx-auto mb-4 max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Firebase 설정이 필요합니다. `client/.env.example`을 참고해 `client/.env`를 생성하세요.
            </div>
          )}
          {authMode === 'login' ? (
            <Login onSwitchToRegister={() => setAuthMode('register')} />
          ) : (
            <Register onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 text-slate-950">
      <section className="bg-blue-700 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6">
          <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/30">
                <Car size={16} /> Car Manager
              </div>
              <h1 className="text-3xl font-bold tracking-normal text-white md:text-4xl">자동차 재고 관리</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-blue-100">
                Firebase Authentication으로 로그인한 사용자만 자동차 데이터를 관리합니다.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <div className="rounded-md bg-white/15 px-3 py-2 text-left text-sm ring-1 ring-white/25">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck size={16} />
                  {user.email}
                </div>
                <div className="mt-0.5 text-blue-100">
                  {userProfile?.userType === 'dealer' ? '딜러' : '일반 사용자'}
                </div>
              </div>
              <button type="button" onClick={loadCars} className="primary-button bg-white px-4 text-blue-700 hover:bg-blue-50">
                <RefreshCcw size={17} />
                전체 목록
              </button>
              <button type="button" onClick={logout} className="primary-button bg-slate-950 px-4 text-white hover:bg-slate-800">
                <LogOut size={17} />
                로그아웃
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-card border-l-4 border-l-blue-500">
              <div className="metric-icon bg-emerald-100 text-emerald-700">
                <Car size={21} />
              </div>
              <div>
                <p className="metric-label">등록 차량</p>
                <p className="metric-value">{cars.length}대</p>
              </div>
            </div>
            <div className="metric-card border-l-4 border-l-green-500">
              <div className="metric-icon bg-sky-100 text-sky-700">
                <Building2 size={21} />
              </div>
              <div>
                <p className="metric-label">제조사</p>
                <p className="metric-value">{companyCount}개</p>
              </div>
            </div>
            <div className="metric-card border-l-4 border-l-yellow-500">
              <div className="metric-icon bg-amber-100 text-amber-700">
                <WalletCards size={21} />
              </div>
              <div>
                <p className="metric-label">평균 가격</p>
                <p className="metric-value">{averagePrice.toLocaleString()}만원</p>
              </div>
            </div>
            <div className="metric-card border-l-4 border-l-red-500">
              <div className="metric-icon bg-violet-100 text-violet-700">
                <Gauge size={21} />
              </div>
              <div>
                <p className="metric-label">최신 연식</p>
                <p className="metric-value">{newestYear}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[380px_1fr]">
        <aside className="space-y-4">
          <form onSubmit={handleSubmit} className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{editingId ? '자동차 수정' : '자동차 추가'}</h2>
                <p className="mt-1 text-sm text-slate-500">입력한 내용은 API에 저장됩니다.</p>
              </div>
              <span className="status-chip bg-emerald-50 text-emerald-700">CRUD</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="이름" required />
              <input className="input" name="company" value={form.company} onChange={handleChange} placeholder="회사명 예: HYUNDAI" required />
              <input className="input" name="price" value={form.price} onChange={handleChange} placeholder="가격" type="number" required />
              <input className="input" name="year" value={form.year} onChange={handleChange} placeholder="연식" type="number" required />
              <select className="input" name="type" value={form.type} onChange={handleChange} required>
                <option value="sedan">세단</option>
                <option value="suv">SUV</option>
                <option value="hatchback">해치백</option>
                <option value="truck">트럭</option>
                <option value="van">밴</option>
              </select>
              <select className="input" name="fuel" value={form.fuel} onChange={handleChange} required>
                <option value="gasoline">가솔린</option>
                <option value="diesel">디젤</option>
                <option value="hybrid">하이브리드</option>
                <option value="electric">전기</option>
                <option value="lpg">LPG</option>
              </select>
              <input className="input" name="mileage" value={form.mileage} onChange={handleChange} placeholder="주행거리(km)" type="number" min="0" required />
              <input className="input" name="location" value={form.location} onChange={handleChange} placeholder="지역 예: 서울" required />
              <input className="input" name="dealerName" value={form.dealerName} onChange={handleChange} placeholder="딜러 이름" required />
              <textarea className="input min-h-24 resize-y" name="description" value={form.description} onChange={handleChange} placeholder="차량 설명" />
              {!editingId && (
                <input
                  key={fileInputKey}
                  className="input"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => setImage(event.target.files[0] || null)}
                  required
                />
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button className={editingId ? 'primary-button flex-1 bg-yellow-400 text-slate-950 hover:bg-yellow-300' : 'primary-button flex-1 bg-blue-600 hover:bg-blue-700'} type="submit">
                {editingId ? <Check size={17} /> : <Plus size={17} />}
                {editingId ? '수정 완료' : '추가'}
              </button>
              {editingId && (
                <button className="secondary-button" type="button" onClick={resetForm}>
                  취소
                </button>
              )}
            </div>
          </form>

          <form className="panel p-5" onSubmit={handleSearch}>
            <h2 className="text-lg font-bold text-slate-950">차량 복합 검색</h2>
            <p className="mt-1 text-sm text-slate-500">입력한 조건을 모두 만족하는 차량을 검색합니다.</p>
            <div className="mt-4 grid gap-2">
              <input className="input" name="keyword" value={search.keyword} onChange={handleSearchChange} placeholder="차량명 예: Sonata" />
              <input className="input" name="company" value={search.company} onChange={handleSearchChange} placeholder="제조사 예: HYUNDAI" />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" name="minPrice" value={search.minPrice} onChange={handleSearchChange} placeholder="최소 가격" type="number" min="0" />
                <input className="input" name="maxPrice" value={search.maxPrice} onChange={handleSearchChange} placeholder="최대 가격" type="number" min="0" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="input" name="minYear" value={search.minYear} onChange={handleSearchChange} placeholder="최소 연식" type="number" />
                <input className="input" name="maxYear" value={search.maxYear} onChange={handleSearchChange} placeholder="최대 연식" type="number" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="primary-button flex-1 bg-green-600 hover:bg-green-700" type="submit">
                <Search size={17} />
                검색
              </button>
              <button className="secondary-button" type="button" onClick={resetSearch}>
                초기화
              </button>
            </div>
          </form>
        </aside>

        <section className="space-y-4">
          <div className="panel flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">차량 카드 목록</h2>
              <p className="mt-1 text-sm text-slate-500">현재 화면에 {cars.length}대가 표시됩니다.</p>
            </div>
            <p className="status-message">{message || '목록을 불러오는 중입니다.'}</p>
          </div>

          {cars.length === 0 ? (
            <div className="panel flex min-h-80 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                <Car size={36} />
              </div>
              <p className="mt-4 text-lg font-bold text-slate-800">표시할 자동차가 없습니다.</p>
              <p className="mt-2 text-sm text-slate-500">검색어나 가격 조건을 바꾸거나 전체 목록을 다시 불러오세요.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {cars.map((car) => (
                <article key={car._id} className="car-card">
                  {car.imageUrl && (
                    <img
                      className="mb-4 h-44 w-full rounded-md object-cover"
                      src={apiUrl(car.imageUrl)}
                      alt={`${car.name} 차량`}
                    />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="status-chip bg-slate-100 text-slate-700">{car.company}</span>
                      <h3 className="mt-3 text-2xl font-bold text-slate-950">{car.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">ID {car._id}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                      <Car size={25} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="info-box">
                      <p className="info-label">가격</p>
                      <p className="info-value text-emerald-700">{car.price.toLocaleString()}만원</p>
                    </div>
                    <div className="info-box">
                      <p className="info-label">연식</p>
                      <p className="info-value text-slate-900">{car.year}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                    <Link className="secondary-button flex-1" to={`/cars/${car._id}`}>
                      상세 보기
                    </Link>
                    <button className="edit-button flex-1" type="button" onClick={() => handleEdit(car)}>
                      <Pencil size={16} />
                      수정
                    </button>
                    <button className="danger-button" type="button" onClick={() => handleDelete(car._id)} aria-label="삭제">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;

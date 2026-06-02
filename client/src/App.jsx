import { useEffect, useState } from 'react';
import { Building2, Car, Check, Gauge, Pencil, Plus, RefreshCcw, Search, Trash2, WalletCards } from 'lucide-react';

const emptyForm = {
  name: '',
  company: '',
  price: '',
  year: '',
};

function App() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [company, setCompany] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [message, setMessage] = useState('');

  const totalPrice = cars.reduce((sum, car) => sum + car.price, 0);
  const averagePrice = cars.length ? Math.round(totalPrice / cars.length) : 0;
  const newestYear = cars.length ? Math.max(...cars.map((car) => car.year)) : '-';
  const companyCount = new Set(cars.map((car) => car.company)).size;

  const loadCars = async () => {
    const response = await fetch('/cars');
    const data = await response.json();
    setCars(data);
    setMessage('전체 목록을 불러왔습니다.');
  };

  useEffect(() => {
    loadCars();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isEditing = Boolean(editingId);
    const carData = {
      name: form.name,
      company: form.company.toUpperCase(),
      price: Number(form.price),
      year: Number(form.year),
    };

    const url = isEditing ? `/cars/${editingId}` : '/cars';
    const method = isEditing ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carData),
    });

    resetForm();
    await loadCars();
    setMessage(isEditing ? '자동차 정보를 수정했습니다.' : '새 자동차를 추가했습니다.');
  };

  const handleEdit = (car) => {
    setEditingId(car._id);
    setForm({
      name: car.name,
      company: car.company,
      price: String(car.price),
      year: String(car.year),
    });
    setMessage(car.name + ' 수정 모드입니다.');
  };

  const handleDelete = async (id) => {
    await fetch(`/cars/${id}`, { method: 'DELETE' });
    await loadCars();
    setMessage('자동차를 삭제했습니다.');
  };

  const searchByCompany = async () => {
    const query = company ? `?company=${encodeURIComponent(company.toUpperCase())}` : '';
    const response = await fetch('/cars/search' + query);
    const data = await response.json();
    setCars(data);
    setMessage(company ? company.toUpperCase() + ' 검색 결과입니다.' : '전체 목록을 불러왔습니다.');
  };

  const filterByPrice = async () => {
    const params = new URLSearchParams();

    if (minPrice) {
      params.append('minPrice', minPrice);
    }

    if (maxPrice) {
      params.append('maxPrice', maxPrice);
    }

    const query = params.toString() ? '?' + params.toString() : '';
    const response = await fetch('/cars/filter' + query);
    const data = await response.json();
    setCars(data);
    setMessage('가격 필터 결과입니다.');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 text-zinc-950">
      <section className="bg-blue-700 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6">
          <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/30">
                <Car size={16} /> Car Manager
              </div>
              <h1 className="text-3xl font-bold tracking-normal text-white md:text-4xl">자동차 재고 관리</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-blue-100">Express REST API와 연결된 React 카드형 대시보드입니다.</p>
            </div>
            <button type="button" onClick={loadCars} className="primary-button bg-white px-4 text-blue-700 hover:bg-blue-50">
              <RefreshCcw size={17} />
              전체 목록
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-card border-l-4 border-l-blue-500">
              <div className="metric-icon bg-emerald-100 text-emerald-700"><Car size={21} /></div>
              <div>
                <p className="metric-label">등록 차량</p>
                <p className="metric-value">{cars.length}대</p>
              </div>
            </div>
            <div className="metric-card border-l-4 border-l-green-500">
              <div className="metric-icon bg-sky-100 text-sky-700"><Building2 size={21} /></div>
              <div>
                <p className="metric-label">제조사</p>
                <p className="metric-value">{companyCount}개</p>
              </div>
            </div>
            <div className="metric-card border-l-4 border-l-yellow-500">
              <div className="metric-icon bg-amber-100 text-amber-700"><WalletCards size={21} /></div>
              <div>
                <p className="metric-label">평균 가격</p>
                <p className="metric-value">{averagePrice.toLocaleString()}만원</p>
              </div>
            </div>
            <div className="metric-card border-l-4 border-l-red-500">
              <div className="metric-icon bg-violet-100 text-violet-700"><Gauge size={21} /></div>
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
                <h2 className="text-lg font-bold text-zinc-950">{editingId ? '자동차 수정' : '자동차 추가'}</h2>
                <p className="mt-1 text-sm text-zinc-500">입력 후 바로 API에 저장됩니다.</p>
              </div>
              <span className="status-chip bg-emerald-50 text-emerald-700">CRUD</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="이름" required />
              <input className="input" name="company" value={form.company} onChange={handleChange} placeholder="회사 예: HYUNDAI" required />
              <input className="input" name="price" value={form.price} onChange={handleChange} placeholder="가격" type="number" required />
              <input className="input" name="year" value={form.year} onChange={handleChange} placeholder="연식" type="number" required />
            </div>
            <div className="mt-4 flex gap-2">
              <button className={editingId ? 'primary-button flex-1 bg-yellow-400 text-zinc-950 hover:bg-yellow-300' : 'primary-button flex-1 bg-blue-600 hover:bg-blue-700'} type="submit">
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="panel p-5">
              <h2 className="text-lg font-bold text-zinc-950">회사 검색</h2>
              <div className="mt-4 flex gap-2">
                <input className="input" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="HYUNDAI" />
                <button className="icon-button bg-zinc-950 text-white hover:bg-zinc-800" type="button" onClick={searchByCompany} aria-label="회사 검색">
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-bold text-zinc-950">가격 필터</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <input className="input" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="최소" type="number" />
                <input className="input" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="최대" type="number" />
              </div>
              <button className="primary-button mt-3 w-full bg-green-600 hover:bg-green-700" type="button" onClick={filterByPrice}>
                <Search size={17} />
                필터 적용
              </button>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="panel flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-950">차량 카드 목록</h2>
              <p className="mt-1 text-sm text-zinc-500">현재 화면에 {cars.length}대가 표시됩니다.</p>
            </div>
            <p className="status-message">{message || '목록을 불러오는 중입니다.'}</p>
          </div>

          {cars.length === 0 ? (
            <div className="panel flex min-h-80 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
                <Car size={36} />
              </div>
              <p className="mt-4 text-lg font-bold text-zinc-800">표시할 자동차가 없습니다.</p>
              <p className="mt-2 text-sm text-zinc-500">검색어나 가격 조건을 바꾸거나 전체 목록을 다시 불러오세요.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {cars.map((car) => (
                <article key={car._id} className="car-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="status-chip bg-zinc-100 text-zinc-700">{car.company}</span>
                      <h3 className="mt-3 text-2xl font-bold text-zinc-950">{car.name}</h3>
                      <p className="mt-1 text-sm text-zinc-400">ID {car._id}</p>
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
                      <p className="info-value text-zinc-900">{car.year}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-zinc-100 pt-4">
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

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, LogOut, Home, BookOpen, Heart, Shield } from 'lucide-react';

const API_URL = "https://web-production-2da4a.up.railway.app/api";


const App = () => {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    phone: ''
  });

  const [bookingForm, setBookingForm] = useState({
    booking_date: '',
    time_slot: '09:00',
    notes: ''
  });

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMe(token);
    }
    fetchServices();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchMe = async (token) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        fetchBookings(token);
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Fetch me error:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/services`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Fetch services error:', err);
    }
  };

  const fetchBookings = async (token) => {
    try {
      const res = await fetch(`${API_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Fetch bookings error:', err);
    }
  };

  const handleAuth = async () => {
    if (authMode === 'admin') {
      // Admin login logic
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authForm.email, password: authForm.password })
        });

        const data = await res.json();
        
        if (res.ok && data.user.role === 'ADMIN') {
          localStorage.setItem('token', data.access_token);
          setUser(data.user);
          fetchBookings(data.access_token);
          showMessage('success', 'Welcome Admin!');
          setPage('admin-dashboard');
        } else {
          showMessage('error', 'Invalid admin credentials');
        }
      } catch (err) {
        showMessage('error', 'Login failed');
      }
      setLoading(false);
      return;
    }

    // Regular user auth
    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? 'login' : 'register';
      const body = authMode === 'login' 
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (res.ok) {
        if (authMode === 'login') {
          localStorage.setItem('token', data.access_token);
          setUser(data.user);
          fetchBookings(data.access_token);
          showMessage('success', 'Welcome back!');
          setPage('services');
        } else {
          showMessage('success', 'Account created! Please login.');
          setAuthMode('login');
          setAuthForm({ email: authForm.email, password: '', username: '', full_name: '', phone: '' });
        }
      } else {
        showMessage('error', data.detail || 'Authentication failed');
      }
    } catch (err) {
      showMessage('error', 'Network error - Is backend running?');
      console.error('Auth error:', err);
    }
    setLoading(false);
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          ...bookingForm
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        if (data.payment_status === 'SUCCESS') {
          showMessage('success', '🎉 Booking confirmed! Payment successful.');
        } else {
          showMessage('error', '❌ Payment failed. Please retry from My Bookings.');
        }
        fetchBookings();
        setPage('bookings');
        setSelectedService(null);
        setBookingForm({ booking_date: '', time_slot: '09:00', notes: '' });
      } else {
        showMessage('error', data.detail || 'Booking failed');
      }
    } catch (err) {
      showMessage('error', 'Network error');
    }
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking? (24h advance notice required)')) return;
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        showMessage('success', 'Booking cancelled successfully');
        fetchBookings();
      } else {
        const data = await res.json();
        showMessage('error', data.detail || 'Cancellation failed');
      }
    } catch (err) {
      showMessage('error', 'Network error');
    }
  };

  const handleRetryPayment = async (bookingId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/retry-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await res.json();
      
      if (res.ok) {
        if (data.payment_status === 'SUCCESS') {
          showMessage('success', '✅ Payment successful! Booking confirmed.');
        } else {
          showMessage('error', '❌ Payment failed. Please try again.');
        }
        fetchBookings();
      } else {
        showMessage('error', data.detail || 'Payment retry failed');
      }
    } catch (err) {
      showMessage('error', 'Network error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setBookings([]);
    setPage('home');
    showMessage('success', 'Logged out successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Landing/Auth Page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
        <nav className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white">Wellness Hub</span>
            </div>
            <div className="flex gap-4">
              {page === 'home' && (
                <button
                  onClick={() => setPage('auth')}
                  className="px-6 py-2 bg-white text-purple-600 rounded-full font-semibold hover:bg-opacity-90 transition"
                >
                  Get Started
                </button>
              )}
              {page === 'auth' && (
                <button
                  onClick={() => setPage('home')}
                  className="px-6 py-2 bg-white bg-opacity-20 text-white rounded-full font-semibold hover:bg-opacity-30 transition"
                >
                  Back to Home
                </button>
              )}
            </div>
          </div>
        </nav>

        {page === 'home' && (
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-6">
                Transform Your Wellness Journey
              </h1>
              <p className="text-2xl mb-12 text-white text-opacity-90">
                Book yoga sessions, nutrition consultations, and mental wellness workshops
              </p>
              <button
                onClick={() => setPage('auth')}
                className="px-12 py-4 bg-white text-purple-600 rounded-full text-xl font-bold hover:scale-105 transform transition shadow-2xl"
              >
                Start Your Journey
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-20">
              {[
                { icon: '🧘', title: 'Yoga Therapy', desc: 'Expert-led sessions for mind & body' },
                { icon: '🥗', title: 'Nutrition Plans', desc: 'Personalized diet consultations' },
                { icon: '🧠', title: 'Mental Wellness', desc: 'Workshops & one-on-one support' }
              ].map((item, i) => (
                <div key={i} className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 text-center hover:bg-opacity-20 transition">
                  <div className="text-6xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white text-opacity-80">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'auth' && (
          <div className="max-w-md mx-auto px-6 py-12">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                {authMode === 'login' ? 'Welcome Back' : authMode === 'admin' ? 'Admin Login' : 'Create Account'}
              </h2>

              <div className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <input
                      type="text"
                      placeholder="Username"
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={authForm.full_name}
                      onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                    />
                  </>
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                />

                <button
                  onClick={handleAuth}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : authMode === 'admin' ? 'Login as Admin' : 'Sign Up')}
                </button>
              </div>

              {authMode !== 'admin' && (
                <p className="text-center mt-6 text-gray-600">
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthForm({ email: '', password: '', username: '', full_name: '', phone: '' });
                    }}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'admin' ? 'login' : 'admin');
                    setAuthForm({ email: authMode === 'admin' ? '' : '', password: authMode === 'admin' ? '' : '', username: '', full_name: '', phone: '' });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-indigo-600 font-semibold hover:text-indigo-700 transition"
                >
                  <Shield className="w-5 h-5" />
                  {authMode === 'admin' ? 'User Login' : 'Admin Login'}
                </button>
              </div>
            </div>
          </div>
        )}

        {message.text && (
          <div className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white font-semibold z-50`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  // Admin Dashboard (if admin user)
  if (user.role === 'ADMIN') {
    return <AdminPanel user={user} onLogout={handleLogout} showMessage={showMessage} />;
  }

  // Regular User Interface
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Wellness Hub
              </span>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setPage('services')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${page === 'services' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Home className="w-5 h-5" />
                Services
              </button>
              <button
                onClick={() => setPage('bookings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${page === 'bookings' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <BookOpen className="w-5 h-5" />
                My Bookings
              </button>
              
              <div className="flex items-center gap-3 pl-6 border-l-2 border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user?.full_name || user?.username}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-4 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {message.text && (
        <div className={`fixed top-20 right-4 px-6 py-4 rounded-xl shadow-xl ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white font-semibold z-50`}>
          {message.text}
        </div>
      )}

      {page === 'services' && !selectedService && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Available Services</h1>
          
          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">No services available yet. Please check back later!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {services.map(service => (
                <div key={service.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1">
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-6xl">
                    {['🧘', '🥗', '🧠', '☎️', '🧘‍♀️', '💪'][service.id % 6]}
                  </div>
                  <div className="p-6">
                    <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                      {service.category}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-800 mt-3 mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-semibold text-gray-800">{service.duration_minutes} min</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expert</p>
                        <p className="font-semibold text-gray-800">{service.expert_name || 'Various'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-purple-600">₹{service.price}</span>
                      <button
                        onClick={() => {
                          setSelectedService(service);
                          setPage('booking');
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {page === 'booking' && selectedService && (
        <div className="max-w-3xl mx-auto px-6 py-12">
          <button
            onClick={() => {
              setSelectedService(null);
              setPage('services');
            }}
            className="mb-6 text-purple-600 font-semibold hover:underline"
          >
            ← Back to Services
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Book {selectedService.title}</h2>
            
            <div className="bg-purple-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-bold text-purple-600">₹{selectedService.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-xl font-semibold text-gray-800">{selectedService.duration_minutes} minutes</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={bookingForm.booking_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Select Time Slot
                </label>
                <select
                  value={bookingForm.time_slot}
                  onChange={(e) => setBookingForm({ ...bookingForm, time_slot: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                  placeholder="Any special requirements..."
                />
              </div>

              <button
                onClick={handleBooking}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Booking & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {page === 'bookings' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">My Bookings</h1>
          
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-6">No bookings yet</p>
              <button
                onClick={() => setPage('services')}
                className="px-8 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-gray-800">{booking.service.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentColor(booking.payment_status)}`}>
                          {booking.payment_status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {booking.time_slot}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>₹{booking.total_amount}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <p className="mt-3 text-sm text-gray-600 italic">Note: {booking.notes}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {booking.payment_status === 'FAILED' && booking.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleRetryPayment(booking.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
                        >
                          Retry Payment
                        </button>
                      )}
                      {booking.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Admin Panel Component
const AdminPanel = ({ user, onLogout, showMessage }) => {
  const [page, setPage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    title: '',
    category: 'Yoga Therapy',
    description: '',
    price: '',
    duration_minutes: '60',
    expert_name: '',
    image_url: '/static/images/default-service.jpg'
  });

  const [editingService, setEditingService] = useState(null);

  const categories = [
    'Yoga Therapy',
    'Nutrition Consultation',
    'Mental Wellness Workshop',
    'One-on-One Expert Call',
    'Meditation & Mindfulness',
    'Fitness Training'
  ];

  useEffect(() => {
    fetchDashboard();
    fetchUsers();
    fetchServices();
    fetchBookings();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/services`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateService = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...serviceForm,
          price: parseFloat(serviceForm.price),
          duration_minutes: parseInt(serviceForm.duration_minutes)
        })
      });

      if (res.ok) {
        showMessage('success', 'Service created successfully!');
        fetchServices();
        fetchDashboard();
        setServiceForm({
          title: '',
          category: 'Yoga Therapy',
          description: '',
          price: '',
          duration_minutes: '60',
          expert_name: '',
          image_url: '/static/images/default-service.jpg'
        });
      } else {
        showMessage('error', 'Failed to create service');
      }
    } catch (err) {
      showMessage('error', 'Network error');
    }
    setLoading(false);
  };

  const handleUpdateService = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...serviceForm,
          price: parseFloat(serviceForm.price),
          duration_minutes: parseInt(serviceForm.duration_minutes)
        })
      });

      if (res.ok) {
        showMessage('success', 'Service updated successfully!');
        fetchServices();
        fetchDashboard();
        setEditingService(null);
        setServiceForm({
          title: '',
          category: 'Yoga Therapy',
          description: '',
          price: '',
          duration_minutes: '60',
          expert_name: '',
          image_url: '/static/images/default-service.jpg'
        });
      } else {
        showMessage('error', 'Failed to update service');
      }
    } catch (err) {
      showMessage('error', 'Network error');
    }
    setLoading(false);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Deactivate this service?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        showMessage('success', 'Service deactivated');
        fetchServices();
        fetchDashboard();
      } else {
        showMessage('error', 'Failed to delete service');
      }
    } catch (err) {
      showMessage('error', 'Network error');
    }
  };

  const startEdit = (service) => {
    setEditingService(service);
    setServiceForm({
      title: service.title,
      category: service.category,
      description: service.description,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      expert_name: service.expert_name || '',
      image_url: service.image_url
    });
    setPage('services');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-indigo-600 to-purple-600 text-white fixed h-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8" />
            <span className="text-xl font-bold">Admin Panel</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setPage('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition ${page === 'dashboard' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setPage('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition ${page === 'users' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
            >
              <User className="w-5 h-5" />
              Users
            </button>
            <button
              onClick={() => setPage('services')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition ${page === 'services' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
            >
              <Heart className="w-5 h-5" />
              Services
            </button>
            <button
              onClick={() => setPage('bookings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition ${page === 'bookings' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
            >
              <BookOpen className="w-5 h-5" />
              Bookings
            </button>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-4">
              <p className="text-sm opacity-80">Logged in as</p>
              <p className="font-semibold">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        {/* Dashboard */}
        {page === 'dashboard' && stats && (
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <User className="w-12 h-12 text-blue-500" />
                  <span className="text-3xl font-bold text-gray-800">{stats.total_users}</span>
                </div>
                <p className="text-gray-600 font-semibold">Total Users</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="w-12 h-12 text-purple-500" />
                  <span className="text-3xl font-bold text-gray-800">{stats.total_bookings}</span>
                </div>
                <p className="text-gray-600 font-semibold">Total Bookings</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">💰</span>
                  <span className="text-3xl font-bold text-gray-800">₹{stats.total_revenue.toFixed(2)}</span>
                </div>
                <p className="text-gray-600 font-semibold">Total Revenue</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8" />
                  <span className="text-4xl font-bold">{stats.pending_bookings}</span>
                </div>
                <p className="font-semibold">Pending Bookings</p>
              </div>

              <div className="bg-gradient-to-br from-green-400 to-teal-400 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">✓</span>
                  <span className="text-4xl font-bold">{stats.confirmed_bookings}</span>
                </div>
                <p className="font-semibold">Confirmed Bookings</p>
              </div>

              <div className="bg-gradient-to-br from-red-400 to-pink-400 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">✕</span>
                  <span className="text-4xl font-bold">{stats.cancelled_bookings}</span>
                </div>
                <p className="font-semibold">Cancelled Bookings</p>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {page === 'users' && (
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Registered Users ({users.length})</h1>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Username</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Full Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-800 font-semibold">{u.id}</td>
                      <td className="px-6 py-4 text-gray-800">{u.username}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-gray-800">{u.full_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{u.phone || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Services */}
        {page === 'services' && (
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Manage Services</h1>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingService ? 'Edit Service' : 'Create New Service'}
                </h2>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Service Title"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                  />

                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <textarea
                    placeholder="Description"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Duration (min)"
                      value={serviceForm.duration_minutes}
                      onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Expert Name"
                    value={serviceForm.expert_name}
                    onChange={(e) => setServiceForm({ ...serviceForm, expert_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                  />

                  <div className="flex gap-4">
                    <button
                      onClick={editingService ? handleUpdateService : handleCreateService}
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
                    </button>
                    {editingService && (
                      <button
                        onClick={() => {
                          setEditingService(null);
                          setServiceForm({
                            title: '',
                            category: 'Yoga Therapy',
                            description: '',
                            price: '',
                            duration_minutes: '60',
                            expert_name: '',
                            image_url: '/static/images/default-service.jpg'
                          });
                        }}
                        className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Existing Services ({services.length})</h2>
                <div className="max-h-screen overflow-y-auto space-y-4">
                  {services.map(service => (
                    <div key={service.id} className="bg-white rounded-xl shadow p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800">{service.title}</h3>
                          <p className="text-sm text-purple-600 font-semibold">{service.category}</p>
                          <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>₹{service.price}</span>
                            <span>{service.duration_minutes}min</span>
                            <span>{service.expert_name}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(service)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings */}
        {page === 'bookings' && (
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">All Bookings ({bookings.length})</h1>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">User</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Service</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date & Time</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-800 font-semibold">{booking.id}</td>
                        <td className="px-6 py-4 text-gray-800">
                          <div>
                            <p className="font-semibold">{booking.user.username}</p>
                            <p className="text-sm text-gray-600">{booking.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-800">{booking.service.title}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <div>
                            <p>{new Date(booking.booking_date).toLocaleDateString()}</p>
                            <p className="text-sm">{booking.time_slot}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-semibold">₹{booking.total_amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.payment_status === 'SUCCESS' ? 'bg-green-100 text-green-800' : booking.payment_status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {booking.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
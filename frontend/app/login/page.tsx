'use client'

import React, { useState } from 'react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt with:', { email, password })
    // Add your login logic here
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000370' }}>
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        {/* Login Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFA500' }}>
            LOGIN
          </h1>
          <p style={{ color: '#FFD27F' }}>
            Enter your credentials to continue
          </p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-5">
            <label className="block font-semibold mb-2" style={{ color: '#7bff00' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ 
                backgroundColor: '#daee90',
                borderColor: '#7CCD7C',
                color: '#000370'
              }}
              required
            />
          </div>
          
          {/* Password Field */}
          <div className="mb-6">
            <label className="block font-semibold mb-2" style={{ color: '#e5ff00' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ 
                backgroundColor: '#c2ee90',
                borderColor: '#7CCD7C',
                color: '#003470'
              }}
              required
            />
          </div>
          
          {/* Remember Me & Forgot Password */}
          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 accent-green-500" />
              <span style={{ color: '#FFD27F' }}>Remember me</span>
            </label>
            <a href="#" style={{ color: '#FFD27F' }} className="hover:underline">
              Forgot Password?
            </a>
          </div>
          
          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold transition duration-200"
            style={{ 
              backgroundColor: '#1eff00',
              color: '#047000'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5eff00'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff7300'
            }}
          >
            LOGIN
          </button>
        </form>
        
        {/* Register Link */}
        <div className="text-center mt-6 pt-4 border-t" style={{ borderColor: '#FFD27F' }}>
          <p>
            <span style={{ color: '#FFD27F' }}>Don't have an account? </span>
            <a href="/register" style={{ color: '#FFA500' }} className="hover:underline font-semibold">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
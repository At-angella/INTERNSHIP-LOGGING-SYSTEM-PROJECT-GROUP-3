'use client'

import React, { useState } from 'react'

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    studentNumber: '',
    registrationNumber: '',
    yearOfStudy: '',
    courseName: '',
    internshipCompany: '',
    onGroundSupervisor: '',
    universitySupervisor: '',
    placeOfResidence: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Registration data:', formData)
    // Add your registration logic here
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#000370',
      padding: '2rem'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.75rem', 
        width: '100%', 
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h1 style={{ 
          color: '#FFA500', 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '0.5rem' 
        }}>
          REGISTER
        </h1>
        
        <p style={{ 
          color: '#FFD27F', 
          textAlign: 'center', 
          marginBottom: '1.5rem' 
        }}>
          Create your account
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Row 1: First Name & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                FIRST NAME
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#90EE90',
                  border: '1px solid #7CCD7C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                LAST NAME
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#90EE90',
                  border: '1px solid #7CCD7C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
          </div>
          
          {/* Row 2: Date of Birth */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              DATE OF BIRTH
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: '#90EE90',
                border: '1px solid #7CCD7C',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          {/* Row 3: Student Number & Registration Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                STUDENT NUMBER
              </label>
              <input
                type="text"
                name="studentNumber"
                value={formData.studentNumber}
                onChange={handleChange}
                placeholder="Enter your student number"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#90EE90',
                  border: '1px solid #7CCD7C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                REGISTRATION NUMBER
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Enter your registration number"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#90EE90',
                  border: '1px solid #7CCD7C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
          </div>
          
          {/* Row 4: Year of Study & Course Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                YEAR OF STUDY
              </label>
              <select
                name="yearOfStudy"
                value={formData.yearOfStudy}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#90EE90',
                  border: '1px solid #7CCD7C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              >
                <option value="">Select year</option>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
              </select>
            </div>
            
            <div>
              <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                COURSE NAME
              </label>
              <input
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                placeholder="Enter your course name"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#90EE90',
                  border: '1px solid #7CCD7C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
          </div>
          
          {/* Row 5: Internship Placement Company */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              INTERNSHIP PLACEMENT COMPANY
            </label>
            <input
              type="text"
              name="internshipCompany"
              value={formData.internshipCompany}
              onChange={handleChange}
              placeholder="Enter your internship company name"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: '#90EE90',
                border: '1px solid #7CCD7C',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          {/* Row 6: On Ground Supervisor & University Supervisor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                ON GROUND SUPERVISOR
              </label>
              <input
                type="text"
                name="onGroundSupervisor"
                value={formData.onGroundSupervisor}
                onChange={handleChange}
                placeholder="Enter on-ground supervisor name"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#90EE90',
                  border: '1px solid #7CCD7C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                UNIVERSITY SUPERVISOR
              </label>
              <input
                type="text"
                name="universitySupervisor"
                value={formData.universitySupervisor}
                onChange={handleChange}
                placeholder="Enter university supervisor name"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#90EE90',
                  border: '1px solid #7CCD7C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
          </div>
          
          {/* Row 7: Place of Residence */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#FFA500', display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              PLACE OF RESIDENCE
            </label>
            <input
              type="text"
              name="placeOfResidence"
              value={formData.placeOfResidence}
              onChange={handleChange}
              placeholder="Enter your place of residence"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: '#90EE90',
                border: '1px solid #7CCD7C',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          {/* Register Button */}
          <button
            type="submit"
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              backgroundColor: '#FFA500', 
              color: '#000370',
              fontWeight: 'bold',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8C00'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFA500'
            }}
          >
            REGISTER
          </button>
        </form>
        
        {/* Login Link */}
        <div style={{ 
          textAlign: 'center', 
          paddingTop: '1rem', 
          borderTop: '1px solid #FFD27F' 
        }}>
          <span style={{ color: '#FFD27F' }}>Already have an account? </span>
          <a href="/login" style={{ color: '#FFA500', textDecoration: 'none' }}>
            Login here
          </a>
        </div>
      </div>
    </div>
  )
}

export default Register
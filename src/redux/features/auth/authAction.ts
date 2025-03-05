import { createAsyncThunk } from '@reduxjs/toolkit'

const backendURL = 'https://reandata-api.istad.co:443/rpc'

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ 
    firstName, 
    lastName, 
    email, 
    password, 
    confirmPassword, 
    userName 
  }: { 
    firstName: string, 
    lastName?: string, 
    email: string, 
    password: string, 
    confirmPassword: string, 
    userName?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${backendURL}/signup_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_first_name: firstName,
          p_last_name: lastName,
          p_email: email,
          p_pass: password,
          p_confirm_pass: confirmPassword,
          p_user_name: userName || email.split('@')[0]
        })
      })

      // Check if the response is successful
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      // Return custom error message
      if (error instanceof Error) {
        return rejectWithValue(error.message)
      } else {
        return rejectWithValue('An unknown error occurred')
      }
    }
  }
)
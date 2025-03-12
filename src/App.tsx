/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { googleLogout, TokenResponse, useGoogleLogin } from '@react-oauth/google';

function App() {
    // Refined type definitions for Google Profile
    interface GoogleProfile {
        email: string;
        given_name: string;
        family_name: string;
        picture?: string;
        name: string;
    }

    // State declarations with appropriate types
    const [user, setUser] = useState<Omit<TokenResponse, "error" | "error_description" | "error_uri"> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Define user data type for a more specific state instead of 'any'
    interface UserData {
        profile_img?: string;
        user_name: string;
        first_name: string;
        email: string;
    }

    const [userData, setUserData] = useState<UserData | null>(null);

    // Secure password generation function with improved randomization
    const generateSecurePassword = (length = 16): string => {
        const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

        const secureRandomChar = (charSet: string): string => {
            const randomBuffer = new Uint32Array(1);
            crypto.getRandomValues(randomBuffer);
            const randomIndex = randomBuffer[0] % charSet.length;
            return charSet[randomIndex];
        };

        // Ensure at least one character from each set is included
        const password = [
            secureRandomChar(uppercaseChars),
            secureRandomChar(lowercaseChars),
            secureRandomChar(numberChars),
            secureRandomChar(specialChars)
        ];

        // Fill the rest of the password with random characters
        while (password.length < length) {
            password.push(secureRandomChar(allChars));
        }

        // Fisher-Yates shuffle to randomize the password
        for (let i = password.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [password[i], password[j]] = [password[j], password[i]];
        }

        return password.join('');
    };

    // Google Login hook
    const login = useGoogleLogin({
        onSuccess: (codeResponse) => setUser(codeResponse),
        onError: (error) => {
            console.error('Login Failed:', error);
            setError('Google login failed');
        }
    });

    // Fetch Google user data after login
    useEffect(() => {
        if (user) {
            setIsLoading(true);
            fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                headers: {
                    Authorization: `Bearer ${user?.access_token}`,
                    Accept: 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch user information');
                    }
                    return response.json();
                })
                .then(async (data: GoogleProfile) => {
                    console.log("User data from Google:", data);

                    const generatedPassword = generateSecurePassword();

                    try {
                        const backendResponse = await handleBackendAuthentication(data, generatedPassword);
                        console.log("Backend authentication result:", backendResponse);
                    } catch (backendError) {
                        console.error("Backend authentication error:", backendError);
                        setError('Failed to authenticate with backend');
                    }
                })
                .catch((err) => {
                    console.error("Google user info fetch error:", err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch user information');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [user]);

    const handleUpdateUserProfile = async () =>{
       try {
        const updateUserProfile = await fetch('https://reandata-api.istad.co:443/rpc/update_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
             
                
                    first_name_input: "Sokcheat",
                    last_name_input: "Srorng",
                    user_name_input: "SokcheatCooker",
                    user_uuid_input:  localStorage.getItem('uuid')
                  
            })
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const response = updateUserProfile.json();

        
        const userUUid = localStorage.getItem('uuid');

       const getUserByUUID = await fetch(`https://reandata-api.istad.co:443/users?user_uuid=eq.${userUUid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
       })

      const responseUserbyUUID =  await getUserByUUID.json();
       

        console.log("UserProfileByUUID",responseUserbyUUID[0]);
       } catch (error) {
         console.log(error)
        
       }
        

    }

    // Backend authentication function
    const handleBackendAuthentication = async (
        googleProfile: GoogleProfile,
        generatedPassword: string
    ) => {
        try {
            // Attempt to register user with Google info
            const registrationResponse = await fetch('https://reandata-api.istad.co:443/rpc/signup_user_with_google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_first_name: googleProfile.given_name || '',
                    p_last_name: googleProfile.family_name || '',
                    p_email: googleProfile.email,
                    p_user_name: googleProfile.email.split('@')[0],
                    p_pass: generatedPassword,
                    p_user_profile: googleProfile.picture || '',
                    p_confirm_pass: generatedPassword
                })
            });

            const registrationResult = await registrationResponse.json();

            // Check if registration is successful
            if (registrationResponse.ok) {
                console.log('Backend registration successful', registrationResult);

                // Immediately attempt to login after registration
                const loginResponse = await fetch('https://reandata-api.istad.co:443/rpc/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_email: googleProfile.email,
                        user_pass: generatedPassword
                    })
                });

                const loginResult = await loginResponse.json();
                


                // Check if login is successful
                if (loginResult?.result?.success === true) {
                    console.log('Automatic login successful after registration');
                    setUserData(loginResult?.result?.user);
                    alert('Registration and login successful');
                    localStorage.setItem('uuid', loginResult?.result?.user?.user_uuid);
                    return loginResult;
                } else {
                    throw new Error('Automatic login failed after registration');
                }
            } else {
                // If registration fails (e.g., user might already exist), attempt direct login
                const loginResponse = await fetch('https://reandata-api.istad.co:443/rpc/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_email: googleProfile.email,
                        user_pass: generatedPassword
                    })
                });

                const loginResult = await loginResponse.json();

                if (loginResult?.result?.success === true) {
                    console.log('Login successful');
                    setUserData(loginResult?.result?.user);
                    localStorage.setItem('uuid', loginResult?.result?.user?.user_uuid);
                    return loginResult;
                } else {
                    throw new Error(registrationResult.message || 'Authentication failed');
                }
            }
        } catch (error) {
            console.error('Backend authentication error:', error);
            throw error;
        }
    };

    console.log("User data:", userData);

    // Logout function
    const logOut = () => {
        googleLogout();
        setUser(null);
        setUserData(null);
        setError(null);
    };

    // Helper function to get initials for the user
    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN';
    };




    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white shadow-md rounded-lg w-full max-w-md overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                            Try Again
                        </button>
                        
                    </div>
                ) : userData ? (
                    <div className="p-6">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full border-4 border-blue-500 mb-4 overflow-hidden">
                                {userData.profile_img ? (
                                    <img 
                                        src={userData.profile_img} 
                                        alt={userData.user_name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center text-3xl">
                                        {getInitials(userData.user_name)}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-xl font-semibold">{userData?.first_name}</h2>
                            <p className="text-gray-500">{userData?.email}</p>
                            <button
                                onClick={logOut}
                                className="mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Log out
                            </button>
                            <button
                            onClick={handleUpdateUserProfile}
                            >
                                UserProfile
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2">Welcome</h2>
                            <p className="text-gray-600 mb-6">Sign in to continue to your account</p>
                            <button
                                onClick={() => login()}
                                className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                <img 
                                    src="https://www.vectorlogo.zone/logos/google/google-icon.svg" 
                                    alt="Google logo" 
                                    className="w-5 h-5 mr-2"
                                />
                                Sign in with Google
                            </button>
                            <button
                            onClick={handleUpdateUserProfile}
                            >
                                UserProfile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

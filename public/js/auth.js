// public/js/auth.js

const renderLogin = () => {
    document.getElementById('navbar').style.display = 'none';
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="w-full max-w-xs mx-auto mt-20">
            <form id="login-form" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div class="mb-4">
                    <h2 class="text-2xl font-bold text-center text-gray-700">Call Center Login</h2>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="Email" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" required>
                </div>
                <div class="flex items-center justify-between">
                    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                        Sign In
                    </button>
                </div>
                <p id="login-error" class="text-red-500 text-xs italic mt-4 hidden"></p>
            </form>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');

        try {
            const response = await api.login({ email, password });
            localStorage.setItem('jwt_token', response.token);
            localStorage.setItem('user_data', JSON.stringify(response.user));

            errorEl.classList.add('hidden');
            window.location.hash = '#dashboard';
            initApp(); // Re-initialize based on new role
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    });
};

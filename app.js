'use strict'

class User {
    constructor(username, email, registration_date, rating, deleteHandle) {
        this.username = username,
        this.email = email,
        this.registration_date = registration_date,
        this.rating = rating,
        this.deleteHandle = deleteHandle
    }
    render() {
        const userEl = document.createElement('tr')
        userEl.innerHTML = `
            <td>${this.username}</td>
            <td>${this.email}</td>
            <td>${this.#getDate(this.registration_date)}</td>
            <td>${this.rating}</td>
            <td>
                <a href="#" class="delete-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4L20 20" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M4 20L20 4" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </a>
            </td>
        `;
        userEl.querySelector('.delete-btn').addEventListener('click', (event) => {
            event.preventDefault();
            this.deleteHandle(this);
        })
        return userEl;
    }

    #getDate(userDate) {
        const date = new Date(userDate);
        
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);

        const formattedDate = `${day}.${month}.${year}`;
        return formattedDate;
    }
}

class App {
    constructor() {
        this.root = document.querySelector('#table tbody');
        this.searchBox = document.getElementById('search');
        this.dateSortBtn = document.getElementById('dateSort');
        this.raitSortBtn = document.getElementById('raitSort');
        this.clearBtn = document.getElementById('clear');
        this.modal = document.querySelector('.modal');
        this.pagePrevBtn = document.querySelector('.prev');
        this.pageNextBtn = document.querySelector('.next');

        this.users = [];
        this.filteredUsers = [];
        this.sortOrder = { date: true, rating: true };

        this.currentPage = 1;
        this.usersPerPage = 5;

        this.init();
    }

    async init() {
        await this.loadUsers();
        this.addEventListeners();
    }

    async loadUsers() {
        try {
            const response = await fetch('https://5ebbb8e5f2cfeb001697d05c.mockapi.io/users');
            const data = await response.json();
            this.users = data.map(el => new User(el.username, el.email, el.registration_date, el.rating, this.handleDelete));
            this.filteredUsers = [...this.users];
            this.updateTable(this.filteredUsers);
        } catch (error) {
            console.error('Failed to load users', error);
        }
    }

    paginate(users) {
        const start = (this.currentPage - 1) * this.usersPerPage;
        const end = start + this.usersPerPage;
        return users.slice(start, end);
    }

    addEventListeners() {
        this.searchBox.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') this.search();
        });

        this.dateSortBtn.addEventListener('click', (event) => {
            event.preventDefault();
            this.sort('date', 'registration_date', true);
        });

        this.raitSortBtn.addEventListener('click', (event) => {
            event.preventDefault();
            this.sort('rating', 'rating', false);
        });

        this.clearBtn.addEventListener('click', () => {
            this.clearFilters();
        });

        this.pagePrevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--
                this.updateTable(this.filteredUsers)
            }
            
        })

        this.pageNextBtn.addEventListener('click', () => {
            if (this.currentPage < Math.ceil(this.filteredUsers.length / this.usersPerPage)) {
                this.currentPage++
                this.updateTable(this.filteredUsers)
            }
            
        })
    }

    search() {
        const inputValue = this.searchBox.value.trim().toLowerCase();
        if (inputValue !== '') {
            this.filteredUsers = this.users.filter(value =>
                value.email.toLowerCase().includes(inputValue) ||
                value.username.toLowerCase().includes(inputValue)
            );
            this.currentPage = 1;
            this.updateTable(this.filteredUsers);   
            this.showClearBtn();
        }
    }

    sort(type, key, isDate) {
        this.sortOrder[type] = !this.sortOrder[type];

        this.filteredUsers.sort((a, b) => {
            const comparison = isDate
                ? new Date(a[key]) - new Date(b[key])
                : a[key] - b[key];
            return this.sortOrder[type] ? comparison : -comparison;
        });

        [this.dateSortBtn, this.raitSortBtn].forEach(btn => btn.classList.remove('active'));
        
        if (type === 'date') {
            this.dateSortBtn.classList.add('active');
        } else if (type === 'rating') {
            this.raitSortBtn.classList.add('active');
        }

        this.updateTable(this.filteredUsers);
        this.showClearBtn();
    }

    updateTable(users) {
        this.root.innerHTML = '';
        const paginatedUsers = this.paginate(users);
        paginatedUsers.forEach(user => this.root.appendChild(user.render()));
        this.renderPagination();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage);

        const page = `${this.currentPage} / ${totalPages}`

        const pageContainer = document.querySelector('.pagination .page');
        pageContainer.innerHTML = page;
    }

    showClearBtn() {
        if (this.filteredUsers.length < this.users.length
            || this.searchBox.value !== ''
            || this.dateSortBtn.classList.contains('active')
            || this.raitSortBtn.classList.contains('active'))
        {
            this.clearBtn.style.display = 'block';
        } else {
            this.clearBtn.style.display = 'none';
        }
    }

    clearFilters() {
        this.filteredUsers = [...this.users];
        this.searchBox.value = '';
        this.updateTable(this.filteredUsers);
        [this.dateSortBtn, this.raitSortBtn].forEach(btn => btn.classList.remove('active'));
        this.clearBtn.style.display = 'none';
    }

    handleDelete = (userToDelete) => {
        this.showModal(() => {
            this.users = this.users.filter(user => user.email !== userToDelete.email);
            this.filteredUsers = this.filteredUsers.filter(user => user.email !== userToDelete.email);
            this.updateTable(this.filteredUsers);
            this.showClearBtn();
        });
    }

    showModal(onConfirm) {
        this.modal.style.display = 'block'
        document.body.style.overflowY = 'hidden'

        const confirmBtn = this.modal.querySelector('.modal__btn--confirm');
        const cancelBtn = this.modal.querySelector('.modal__btn--cancel');

        const closeModal = () => {
            this.modal.style.display = 'none';
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', closeModal);
            document.body.style.overflowY = ''
        }

        const handleConfirm = () => {
            onConfirm();
            closeModal();
        }
    
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', closeModal);
    }
}

new App()
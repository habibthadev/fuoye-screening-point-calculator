// Application State
const state = {
    jambScore: 0,
    sittingType: 'one',
    subjects: {
        one: [0, 0, 0, 0, 0],
        first: [0, 0, 0, 0, 0],
        second: [0, 0, 0, 0, 0]
    },
    theme: 'light'
};

// DOM Elements
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    jambInput: document.getElementById('jambScore'),
    jambPoints: document.getElementById('jambPoints'),
    olevelPoints: document.getElementById('olevelPoints'),
    sittingRadios: document.querySelectorAll('input[name="sittings"]'),
    oneSittingContainer: document.getElementById('oneSittingSubjects'),
    twoSittingsContainer: document.getElementById('twoSittingsSubjects'),
    calculateBtn: document.getElementById('calculateBtn'),
    recalculateBtn: document.getElementById('recalculateBtn'),
    resultsSection: document.getElementById('resultsSection'),
    resultJamb: document.getElementById('resultJamb'),
    resultSitting: document.getElementById('resultSitting'),
    resultOlevel: document.getElementById('resultOlevel'),
    resultTotal: document.getElementById('resultTotal')
};

// Utility Functions
const utils = {
    // Animate number counting
    animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        const diff = end - start;
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = this.easeOutQuart(progress);
            const current = start + (diff * easeProgress);
            
            element.textContent = current.toFixed(2);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    },
    
    // Easing function
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Calculate JAMB points
    calculateJambPoints(score) {
        return Math.min((score / 400) * 60, 60);
    },
    
    // Calculate O-Level points
    calculateOLevelPoints(sittingType, subjects) {
        if (sittingType === 'one') {
            return subjects.one.reduce((sum, grade) => sum + grade, 0);
        } else {
            const firstSum = subjects.first.reduce((sum, grade) => sum + grade, 0);
            const secondSum = subjects.second.reduce((sum, grade) => sum + grade, 0);
            return (firstSum + secondSum) / 2;
        }
    },
    
    // Get sitting bonus
    getSittingBonus(sittingType) {
        return sittingType === 'one' ? 10 : 6;
    }
};

// Theme Management
const themeManager = {
    init() {
        // Load saved theme
        const savedTheme = localStorage.getItem('fuoye-theme') || 'light';
        this.setTheme(savedTheme);
        
        // Add event listener
        elements.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    },
    
    setTheme(theme) {
        state.theme = theme;
        document.documentElement.className = theme;
        localStorage.setItem('fuoye-theme', theme);
    },
    
    toggleTheme() {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
};

// Custom Select Management
const selectManager = {
    init() {
        this.bindEvents();
        this.closeAllOnOutsideClick();
    },
    
    bindEvents() {
        const selects = document.querySelectorAll('.subject-select');
        
        selects.forEach(select => {
            const trigger = select.querySelector('.select-trigger');
            const items = select.querySelectorAll('.select-item');
            
            // Toggle dropdown
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeAll();
                this.toggleSelect(select);
            });
            
            // Handle item selection
            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectItem(select, item);
                    this.closeAll();
                });
            });
        });
    },
    
    /*
    toggleSelect(select) {
        select.classList.toggle('open');
    }, */
    
    toggleSelect(selectElement) {
    const rect = selectElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 200; // max-height of dropdown
    
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        selectElement.classList.add('open-upward');
    } else {
        selectElement.classList.remove('open-upward');
    }
    
    selectElement.classList.toggle('open');
},   
    closeAll() {
        document.querySelectorAll('.subject-select.open').forEach(select => {
            select.classList.remove('open');
        });
    },
    
    closeAllOnOutsideClick() {
        document.addEventListener('click', () => {
            this.closeAll();
        });
    },
    
    selectItem(select, item) {
        const trigger = select.querySelector('.select-trigger');
        const valueSpan = trigger.querySelector('.select-value');
        const value = parseInt(item.dataset.value);
        const grade = item.dataset.grade;
        const subject = parseInt(select.dataset.subject);
        const sitting = select.dataset.sitting || 'one';
        
        // Update UI
        valueSpan.textContent = item.textContent;
        valueSpan.classList.remove('placeholder');
        
        // Update state
        state.subjects[sitting][subject] = value;
        
        // Update calculations
        calculator.updateOLevelPoints();
    }
};

// Calculator Logic
const calculator = {
    init() {
        this.bindEvents();
        this.updateJambPoints();
        this.updateOLevelPoints();
    },
    
    bindEvents() {
        // JAMB score input
        const debouncedJambUpdate = utils.debounce(() => {
            this.updateJambPoints();
        }, 300);
        
        elements.jambInput.addEventListener('input', debouncedJambUpdate);
        
        // Sitting type change
        elements.sittingRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.handleSittingChange(radio.value);
            });
        });
        
        // Calculate button
        elements.calculateBtn.addEventListener('click', () => {
            this.calculateTotal();
        });
        
        // Recalculate button
        elements.recalculateBtn.addEventListener('click', () => {
            this.hideResults();
        });
    },
    
    updateJambPoints() {
        const score = parseFloat(elements.jambInput.value) || 0;
        state.jambScore = Math.min(Math.max(score, 0), 400);
        
        const points = utils.calculateJambPoints(state.jambScore);
        elements.jambPoints.textContent = points.toFixed(2);
    },
    
    updateOLevelPoints() {
        const points = utils.calculateOLevelPoints(state.sittingType, state.subjects);
        elements.olevelPoints.textContent = points.toFixed(2);
    },
    
    handleSittingChange(sittingType) {
        state.sittingType = sittingType;
        
        // Reset subject scores
        state.subjects.one = [0, 0, 0, 0, 0];
        state.subjects.first = [0, 0, 0, 0, 0];
        state.subjects.second = [0, 0, 0, 0, 0];
        
        // Reset UI
        this.resetSubjectSelects();
        
        // Show/hide appropriate containers
        if (sittingType === 'one') {
            elements.oneSittingContainer.classList.remove('hidden');
            elements.twoSittingsContainer.classList.add('hidden');
        } else {
            elements.oneSittingContainer.classList.add('hidden');
            elements.twoSittingsContainer.classList.remove('hidden');
        }
        
        this.updateOLevelPoints();
    },
    
    resetSubjectSelects() {
        const selects = document.querySelectorAll('.subject-select');
        selects.forEach(select => {
            const valueSpan = select.querySelector('.select-value');
            valueSpan.textContent = 'Select Grade';
            valueSpan.classList.add('placeholder');
        });
    },
    
    validateForm() {
        const errors = [];
        
        // Check JAMB score
        if (!state.jambScore || state.jambScore < 0 || state.jambScore > 400) {
            errors.push('Please enter a valid JAMB score (0-400)');
        }
        
        // Check subject grades
        const subjects = state.subjects[state.sittingType === 'one' ? 'one' : 'first'];
        const hasEmptySubjects = subjects.some(grade => grade === 0);
        
        if (hasEmptySubjects) {
            errors.push('Please select grades for all subjects');
        }
        
        if (state.sittingType === 'two') {
            const secondSubjects = state.subjects.second;
            const hasEmptySecondSubjects = secondSubjects.some(grade => grade === 0);
            
            if (hasEmptySecondSubjects) {
                errors.push('Please select grades for all second sitting subjects');
            }
        }
        
        return errors;
    },
    
    calculateTotal() {
        const errors = this.validateForm();
        
        if (errors.length > 0) {
            this.showErrors(errors);
            return;
        }
        
        // Show loading state
        elements.calculateBtn.classList.add('loading');
        elements.calculateBtn.disabled = true;
        
        // Simulate calculation delay for better UX
        setTimeout(() => {
            this.showResults();
            elements.calculateBtn.classList.remove('loading');
            elements.calculateBtn.disabled = false;
        }, 800);
    },
    
    showErrors(errors) {
        // Simple alert for now - can be enhanced with custom modal
        alert(errors.join('\n'));
    },
    
    showResults() {
        const jambPoints = utils.calculateJambPoints(state.jambScore);
        const sittingBonus = utils.getSittingBonus(state.sittingType);
        const olevelPoints = utils.calculateOLevelPoints(state.sittingType, state.subjects);
        const totalScore = jambPoints + sittingBonus + olevelPoints;
        
        // Update result values with animation
        utils.animateNumber(elements.resultJamb, 0, jambPoints, 800);
        utils.animateNumber(elements.resultSitting, 0, sittingBonus, 800);
        utils.animateNumber(elements.resultOlevel, 0, olevelPoints, 800);
        utils.animateNumber(elements.resultTotal, 0, totalScore, 1000);
        
        // Show results section
        elements.resultsSection.classList.remove('hidden');
        setTimeout(() => {
            elements.resultsSection.classList.add('show');
        }, 100);
        
        // Scroll to results
        elements.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    },
    
    hideResults() {
        elements.resultsSection.classList.remove('show');
        setTimeout(() => {
            elements.resultsSection.classList.add('hidden');
        }, 300);
    }
};

// Icon Initialization
const iconManager = {
    init() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
};

// Form Animation Manager
const animationManager = {
    init() {
        this.observeFormSections();
    },
    
    observeFormSections() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        const sections = document.querySelectorAll('.form-section');
        sections.forEach(section => {
            observer.observe(section);
        });
    }
};

// Application Initialization
class FUOYECalculator {
    constructor() {
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }
    
    initializeApp() {
        try {
            // Initialize all managers
            themeManager.init();
            selectManager.init();
            calculator.init();
            iconManager.init();
            animationManager.init();
            
            console.log('FUOYE Calculator initialized successfully');
        } catch (error) {
            console.error('Error initializing FUOYE Calculator:', error);
        }
    }
}

// Start the application
new FUOYECalculator();
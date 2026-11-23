// 12 laboratorinis darbas – įgūdžių pažanga.
(() => {
  const board = document.querySelector('#skill-board');
  if (!board) return;

  const storageKey = 'edvin-skill-progress-v1';
  const statuses = {
    planned: 'Planuojama',
    learning: 'Mokomasi',
    done: 'Atlikta'
  };
  const skills = [
    { id: 'python', name: 'Python programavimas', status: 'learning', xp: 50 },
    { id: 'pandas', name: 'Duomenų analizė su pandas', status: 'learning', xp: 50 },
    { id: 'sql', name: 'SQL užklausos', status: 'planned', xp: 20 },
    { id: 'visualization', name: 'Duomenų vizualizavimas', status: 'planned', xp: 30 },
    { id: 'machine-learning', name: 'Mašininio mokymosi modeliai', status: 'planned', xp: 80 },
    { id: 'evaluation', name: 'Modelių vertinimas', status: 'planned', xp: 70 },
    { id: 'git', name: 'Git ir GitHub', status: 'learning', xp: 35 }
  ];
  const levels = [
    { number: 1, minimum: 0, rank: 'Pradedantysis' },
    { number: 2, minimum: 50, rank: 'Praktikantas' },
    { number: 3, minimum: 150, rank: 'Specialistas' },
    { number: 4, minimum: 300, rank: 'Profesionalas' }
  ];
  const achievements = [
    { name: 'Įgūdžių atradėjas', description: 'Atlikite bent 1 įgūdį.', unlocked: progress => progress.completed >= 1 },
    { name: 'Įgūdžių meistras', description: 'Atlikite bent 4 įgūdžius.', unlocked: progress => progress.completed >= 4 },
    { name: 'Įgūdžių ekspertas', description: 'Pasiekite 4 lygį.', unlocked: progress => progress.level.number === 4 }
  ];
  const columns = Array.from(board.querySelectorAll('.skill-column'));
  const avatar = document.querySelector('#skill-avatar');
  const achievementsList = document.querySelector('#skill-achievements');

  function restoreStatuses() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      for (const skill of skills) {
        const status = saved?.[skill.id];
        if (typeof status === 'string' && Object.hasOwn(statuses, status)) {
          skill.status = status;
        }
      }
    } catch {
      // Jei saugykla nepasiekiama, naudojamos pradinės būsenos.
    }
  }

  function saveStatuses() {
    try {
      const state = Object.fromEntries(skills.map(skill => [skill.id, skill.status]));
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Įgūdžius galima keisti ir be vietinės saugyklos.
    }
  }

  function renderSkillCard(skill) {
    const card = document.createElement('li');
    card.className = 'skill-card';

    const name = document.createElement('h5');
    name.textContent = skill.name;

    const points = document.createElement('span');
    points.className = 'skill-card-xp';
    points.textContent = `${skill.xp} XP`;

    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = `skill-status-${skill.id}`;
    select.dataset.skill = skill.id;
    select.setAttribute('aria-label', `${skill.name} – būsena`);
    for (const [status, label] of Object.entries(statuses)) {
      select.add(new Option(label, status, false, status === skill.status));
    }

    card.append(name, points, select);
    return card;
  }

  function renderBoard() {
    for (const column of columns) {
      const cards = skills.filter(skill => skill.status === column.dataset.status).map(renderSkillCard);
      column.querySelector('.skill-list').replaceChildren(...cards);
      column.querySelector('.skill-empty').hidden = cards.length > 0;
    }
  }

  function calculateProgress() {
    const completed = skills.filter(skill => skill.status === 'done');
    const xp = completed.reduce((sum, skill) => sum + skill.xp, 0);
    const levelIndex = levels.findLastIndex(level => xp >= level.minimum);
    const level = levels[levelIndex];
    const next = levels[levelIndex + 1];
    const percentage = next ? Math.round((xp - level.minimum) / (next.minimum - level.minimum) * 100) : 100;
    return { xp, level, next, percentage, completed: completed.length };
  }

  function updateAvatar(level) {
    let file;
    if (level === 4) file = 'avatar-level-4.svg';
    else if (level === 3) file = 'avatar-level-3.svg';
    else if (level === 2) file = 'avatar-level-2.svg';
    else file = 'avatar-level-1.svg';
    avatar.src = `assets/img/${file}`;
  }

  function renderAchievements(progress) {
    const cards = achievements.map(achievement => {
      const unlocked = achievement.unlocked(progress);
      const card = document.createElement('li');
      card.className = 'skill-achievement';
      card.dataset.unlocked = unlocked;

      const state = document.createElement('span');
      state.className = 'skill-achievement-state';
      const icon = document.createElement('i');
      icon.className = unlocked ? 'bi bi-unlock-fill' : 'bi bi-lock';
      icon.setAttribute('aria-hidden', 'true');
      state.append(icon, unlocked ? ' Atrakinta' : ' Užrakinta');

      const name = document.createElement('h4');
      name.textContent = achievement.name;
      const description = document.createElement('p');
      description.textContent = achievement.description;

      card.append(state, name, description);
      return card;
    });
    achievementsList.replaceChildren(...cards);
  }

  function renderProgress() {
    const progress = calculateProgress();
    const { xp, level, next, percentage, completed } = progress;
    document.querySelector('#skill-xp').textContent = `${xp} XP`;
    document.querySelector('#skill-level').textContent = `${level.number} lygis`;
    document.querySelector('#skill-rank').textContent = level.rank;
    document.querySelector('#skill-meter').value = percentage;
    document.querySelector('#skill-meter-value').textContent = `${percentage}%`;
    document.querySelector('#skill-next').textContent = next
      ? `${next.minimum - xp} XP iki ${next.number} lygio`
      : 'Pasiektas aukščiausias lygis';
    document.querySelector('#skill-total').textContent = skills.length;
    document.querySelector('#skill-completed').textContent = completed;
    document.querySelector('#skill-percent').textContent = `${Math.round(completed / skills.length * 100)}%`;
    updateAvatar(level.number);
    renderAchievements(progress);
    return progress;
  }

  board.addEventListener('change', event => {
    const select = event.target;
    const skill = skills.find(item => item.id === select.dataset.skill);
    if (!skill || !Object.hasOwn(statuses, select.value) || skill.status === select.value) return;

    skill.status = select.value;
    saveStatuses();
    renderBoard();
    const { xp, level } = renderProgress();
    document.getElementById(select.id).focus();
    document.querySelector('#skill-announcement').textContent =
      `${skill.name}: ${statuses[skill.status]}. ${xp} XP, ${level.number} lygis.`;
  });

  restoreStatuses();
  renderBoard();
  renderProgress();
})();

import('lucide-react').then(m => {
  const names = ['ChartLineIcon','CircleDollarSignIcon','PlayCircleIcon','UsersIcon','LayoutDashboardIcon','ListCollapseIcon','ListIcon','PlusSquareIcon','StarIcon'];
  for (const name of names) {
    const icon = m[name];
    console.log(name, icon === undefined ? 'undefined' : typeof icon, icon && icon.$$typeof ? icon.$$typeof.toString() : 'no $$typeof', icon && icon.displayName ? icon.displayName : 'no displayName');
  }
}).catch(err => { console.error('ERR', err); });

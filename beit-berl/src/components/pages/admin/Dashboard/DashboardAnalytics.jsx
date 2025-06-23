import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Calendar, Users, Building2, Clock, Filter, TrendingUp, Eye, BarChart3, Circle } from 'lucide-react';
import './DashboardAnalytics.css';

// Loading component for charts
const ChartLoader = () => (
  <div className="chart-loader">
    <div className="loading-spinner"></div>
    <p>טוען נתונים...</p>
  </div>
);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={COLORS[index % COLORS.length]}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

const DashboardAnalytics = ({ users = [], organizations = [], hoursTracking = [], isLoading = false }) => {
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [selectedCity, setSelectedCity] = useState('הכל');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [expandedChart, setExpandedChart] = useState(null);

  // Check data readiness
  useEffect(() => {
    if (users.length > 0 && organizations.length > 0) {
      setDataReady(true);
    }
  }, [users.length, organizations.length]);

  // Memoize date conversion function - MOVED TO TOP
  const convertToDate = useCallback((timestamp) => {
    if (!timestamp) return null;

    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    }

    if (timestamp instanceof Date) {
      return timestamp;
    }

    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }

    return null;
  }, []);

  // Memoize static data to prevent recalculation
  const staticData = useMemo(() => ({
    activeVolunteersCount: users.filter(user =>
      user.role === 'volunteer' &&
      hoursTracking.some(hour =>
        String(hour.volunteerId) === String(user.id) ||
        String(hour.volunteerId) === String(user.docId)
      )
    ).length,
    lastUpdateDate: new Date()
  }), [users.length, hoursTracking.length]);

  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const defaultGoal = Math.max(staticData.activeVolunteersCount * 10, 10);
    return defaultGoal;
  });

  // Memoize role labels (static data)
  const roleLabels = useMemo(() => ({
    admin: 'מנהל מערכת',
    volunteer: 'מתנדב',
    orgRep: 'נציג ארגון',
    vc: 'רכז מתנדבים',
    unknown: 'לא ידוע'
  }), []);

  // Memoize static options arrays
  const roles = useMemo(() => [
    { value: 'all', label: 'כל התפקידים' },
    { value: 'admin', label: 'מנהל' },
    { value: 'volunteer', label: 'מתנדב' },
    { value: 'orgRep', label: 'נציג ארגון' },
    { value: 'vc', label: 'רכז מתנדבים' }
  ], []);

  const months = useMemo(() => [
    { value: 'all', label: 'כל החודשים' },
    { value: '1', label: 'ינואר' },
    { value: '2', label: 'פברואר' },
    { value: '3', label: 'מרץ' },
    { value: '4', label: 'אפריל' },
    { value: '5', label: 'מאי' },
    { value: '6', label: 'יוני' },
    { value: '7', label: 'יולי' },
    { value: '8', label: 'אוגוסט' },
    { value: '9', label: 'ספטמבר' },
    { value: '10', label: 'אוקטובר' },
    { value: '11', label: 'נובמבר' },
    { value: '12', label: 'דצמבר' }
  ], []);

  // Get available years from data - NOW convertToDate is available
  const availableYears = useMemo(() => {
    const years = new Set();
    const allDates = [
      ...users.map(u => u.createdAt),
      ...organizations.map(o => o.createdAt),
      ...hoursTracking.map(h => h.createdAt || h.date || h.volDate)
    ].filter(Boolean);

    allDates.forEach(date => {
      const convertedDate = convertToDate(date);
      if (convertedDate) {
        years.add(convertedDate.getFullYear());
      }
    });

    const yearsList = Array.from(years).sort((a, b) => b - a);
    return [
      { value: 'all', label: 'כל השנים' },
      ...yearsList.map(year => ({ value: year.toString(), label: year.toString() }))
    ];
  }, [users, organizations, hoursTracking, convertToDate]);

  // Updated time range checking for year/month filtering
  const isWithinTimeRange = useCallback((date, year, month) => {
    if (!date) return false;
    const itemDate = convertToDate(date);
    if (!itemDate) return false;

    let matches = true;

    if (year !== 'all') {
      matches = matches && itemDate.getFullYear() === parseInt(year);
    }

    if (month !== 'all') {
      matches = matches && (itemDate.getMonth() + 1) === parseInt(month);
    }

    return matches;
  }, [convertToDate]);

  // Get unique cities from organizations
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(organizations
      .map(org => org.city || org.City)
      .filter(Boolean)
    )];
    return ['הכל', ...uniqueCities];
  }, [organizations]);

  // Get organization options
  const orgOptions = useMemo(() => {
    return [
      { id: 'all', name: 'כל הארגונים' },
      ...organizations.map(org => ({
        id: org.docId || org.id,
        name: org.name || org.Name || `ארגון ${org.id}`
      }))
    ];
  }, [organizations]);

  // Filter data with new year/month filtering
  const filteredHours = useMemo(() => {
    const isDefaultFilters =
      selectedYear === 'all' &&
      selectedMonth === 'all' &&
      selectedRole === 'all' &&
      selectedOrg === 'all' &&
      selectedCity === 'הכל';

    if (isDefaultFilters) {
      return hoursTracking;
    }

    return hoursTracking.filter(hour => {
      const dateToCheck = hour.volDate || hour.date || hour.createdAt;
      const withinTime = isWithinTimeRange(dateToCheck, selectedYear, selectedMonth);

      const volunteer = users.find(u =>
        String(u.docId) === String(hour.volunteerId) ||
        String(u.id) === String(hour.volunteerId)
      );
      const roleMatches = selectedRole === 'all' ? true :
        (volunteer && volunteer.role === selectedRole);

      const orgMatches = selectedOrg === 'all' ? true :
        String(hour.orgId) === String(selectedOrg);

      const org = organizations.find(o =>
        String(o.id) === String(hour.orgId) ||
        String(o.Id) === String(hour.orgId)
      );
      const cityMatches = selectedCity === 'הכל' ? true :
        (org && (org.city === selectedCity || org.City === selectedCity));

      return withinTime && roleMatches && orgMatches && cityMatches;
    });
  }, [hoursTracking, selectedYear, selectedMonth, selectedRole, selectedOrg, selectedCity, users, organizations, isWithinTimeRange]);

  const filteredUsers = useMemo(() => {
    const isDefaultFilters =
      selectedYear === 'all' &&
      selectedMonth === 'all' &&
      selectedRole === 'all' &&
      selectedOrg === 'all';

    if (isDefaultFilters) {
      return users;
    }

    return users.filter(user => {
      const withinTime = isWithinTimeRange(user.createdAt, selectedYear, selectedMonth);
      const matchesRole = selectedRole === 'all' ? true :
        user.role === selectedRole;

      // FIXED: Better organization matching for users
      const matchesOrg = selectedOrg === 'all' ? true :
        (user.orgId && (
          String(user.orgId) === String(selectedOrg) ||
          String(user.orgId) === selectedOrg
        ));

      return withinTime && matchesRole && matchesOrg;
    });
  }, [users, selectedYear, selectedMonth, selectedRole, selectedOrg, isWithinTimeRange]);

  const filteredOrgs = useMemo(() => {
    const isDefaultFilters =
      selectedYear === 'all' &&
      selectedMonth === 'all' &&
      selectedCity === 'הכל' &&
      selectedOrg === 'all'; // ADDED: Include org filter

    if (isDefaultFilters) {
      return organizations;
    }

    return organizations.filter(org => {
      const withinTime = isWithinTimeRange(org.createdAt, selectedYear, selectedMonth);
      const matchesCity = selectedCity === 'הכל' ? true :
        org.City === selectedCity || org.city === selectedCity;

      // ADDED: Organization-specific filtering
      const matchesOrg = selectedOrg === 'all' ? true :
        String(org.docId || org.id) === String(selectedOrg);

      return withinTime && matchesCity && matchesOrg;
    });
  }, [organizations, selectedYear, selectedMonth, selectedCity, selectedOrg, isWithinTimeRange]);

  // IMPROVED: Helper function to generate dynamic titles and context
  const getFilterContext = useCallback(() => {
    const parts = [];

    if (selectedYear !== 'all' && selectedMonth !== 'all') {
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      parts.push(`${monthName} ${selectedYear}`);
    } else if (selectedYear !== 'all') {
      parts.push(`שנת ${selectedYear}`);
    } else if (selectedMonth !== 'all') {
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      parts.push(`חודש ${monthName}`);
    }

    if (selectedRole !== 'all') {
      const roleName = roles.find(r => r.value === selectedRole)?.label;
      parts.push(roleName);
    }

    if (selectedOrg !== 'all') {
      const orgName = orgOptions.find(o => o.id === selectedOrg)?.name;
      parts.push(orgName);
    }

    if (selectedCity !== 'הכל') {
      parts.push(`עיר ${selectedCity}`);
    }

    return parts.length > 0 ? ` - ${parts.join(', ')}` : '';
  }, [selectedYear, selectedMonth, selectedRole, selectedOrg, selectedCity, months, roles, orgOptions]);

  // Memoize chart data processing
  const processChartData = useCallback((data, dateField = 'createdAt') => {
    const grouped = {};

    data.forEach(item => {
      const date = convertToDate(item[dateField]);
      if (!date) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [convertToDate]);

  // Chart data with proper dependencies
  const userGrowthData = useMemo(() =>
    processChartData(filteredUsers),
    [filteredUsers, processChartData]
  );

  const orgGrowthData = useMemo(() =>
    processChartData(filteredOrgs),
    [filteredOrgs, processChartData]
  );

  const hoursData = useMemo(() => {
    const grouped = {};
    filteredHours.forEach(hour => {
      const dateToUse = hour.createdAt || hour.date || hour.volDate;
      if (!dateToUse) return;

      const date = convertToDate(dateToUse);
      if (!date) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped[key] = (grouped[key] || 0) + (parseFloat(hour.hours) || 0);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, hours]) => ({
        date,
        hours: parseFloat(hours.toFixed(2))
      }));
  }, [filteredHours, convertToDate]);

  const roleDistribution = useMemo(() => {
    const roleCount = {};
    const total = filteredUsers.length;

    filteredUsers.forEach(user => {
      const role = user.role || 'unknown';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    return Object.entries(roleCount).map(([role, count]) => ({
      name: roleLabels[role] || role,
      value: count,
      percent: total > 0 ? (count / total) : 0
    }));
  }, [filteredUsers, roleLabels]);

  const topOrgsByHours = useMemo(() => {
    const orgHours = {};
    filteredHours.forEach((hour) => {
      if (hour.orgId) {
        const org = organizations.find(o =>
          String(o.id) === String(hour.orgId) ||
          String(o.Id) === String(hour.orgId)
        );
        if (org) {
          const orgName = org.Name || org.name || `ארגון ${hour.orgId}`;
          orgHours[orgName] = (orgHours[orgName] || 0) +
            (parseFloat(hour.hours) || 0);
        }
      }
    });

    return Object.entries(orgHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, hours]) => ({
        name,
        hours: parseFloat(hours.toFixed(2))
      }));
  }, [filteredHours, organizations]);

  const toggleChart = (chartId) => {
    setExpandedChart(expandedChart === chartId ? null : chartId);
  };

  const topVolunteers = useMemo(() => {
    const volunteerHours = {};
    filteredHours.forEach(hour => {
      if (hour.volunteerId) {
        const user = users.find(u =>
          String(u.id) === String(hour.volunteerId) ||
          String(u.docId) === String(hour.volunteerId)
        );
        if (user) {
          const volunteerName =
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            user.email ||
            `משתמש ${user.id}`;
          volunteerHours[volunteerName] =
            (volunteerHours[volunteerName] || 0) +
            (parseFloat(hour.hours) || 0);
        }
      }
    });

    return Object.entries(volunteerHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, hours]) => ({
        name,
        hours: parseFloat(hours.toFixed(2))
      }));
  }, [filteredHours, users]);

  // FIXED: Calculate overview metrics with proper filtering dependencies
  const overviewMetrics = useMemo(() => {
    const totalHours = filteredHours.reduce((sum, hour) =>
      sum + (parseFloat(hour.hours) || 0), 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // FIXED: Use filteredHours for active volunteers calculation
    const activeVolunteers = new Set(
      filteredHours
        .filter(h => {
          const dateToCheck = h.volDate || h.date || h.createdAt;
          const date = convertToDate(dateToCheck);
          return date && date >= thirtyDaysAgo;
        })
        .map(h => h.volunteerId)
    ).size;

    // FIXED: Use filteredOrgs.length for total orgs
    const totalOrgs = filteredOrgs.length;

    const volunteersWithHours = new Set(
      filteredHours.map(h => h.volunteerId).filter(id => id)
    ).size;

    const avgHoursPerVolunteer = volunteersWithHours > 0 ?
      totalHours / volunteersWithHours : 0;

    return {
      totalUsers: filteredUsers.length,
      totalOrgs, // This now reflects filtered organizations
      totalHours,
      activeVolunteers,
      avgHoursPerVolunteer: avgHoursPerVolunteer.toFixed(1)
    };
  }, [filteredUsers.length, filteredOrgs.length, filteredHours, convertToDate]);

  const activeVolunteersPercentage = useMemo(() => {
    const totalVolunteers = filteredUsers.filter(u => u.role === 'volunteer').length;
    if (totalVolunteers === 0) return 0;
    return Math.round((overviewMetrics.activeVolunteers / totalVolunteers) * 100);
  }, [filteredUsers, overviewMetrics.activeVolunteers]);

  // Get current month hours with filtering context
  const getCurrentMonthHours = useCallback((hoursData) => {
    if (selectedYear !== 'all' && selectedMonth !== 'all') {
      // If specific month/year selected, use that data
      return hoursData.reduce((sum, hour) => sum + (parseFloat(hour.hours) || 0), 0);
    } else {
      // Otherwise use actual current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      return hoursData.reduce((sum, hour) => {
        const hourDate = convertToDate(hour.volDate || hour.date || hour.createdAt);
        if (hourDate &&
          hourDate.getMonth() === currentMonth &&
          hourDate.getFullYear() === currentYear) {
          return sum + (parseFloat(hour.hours) || 0);
        }
        return sum;
      }, 0);
    }
  }, [convertToDate, selectedYear, selectedMonth]);

  const calculateGrowthMetrics = useMemo(() => {
    const now = new Date();
    let currentMonth, currentYear, lastMonth, lastYear;

    if (selectedYear !== 'all' && selectedMonth !== 'all') {
      currentYear = parseInt(selectedYear);
      currentMonth = parseInt(selectedMonth) - 1; // JS months are 0-based
      lastMonth = currentMonth - 1;
      lastYear = currentYear;
      if (lastMonth < 0) {
        lastMonth = 11;
        lastYear = currentYear - 1;
      }
    } else {
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();
      lastMonth = currentMonth - 1;
      lastYear = currentYear;
      if (lastMonth < 0) {
        lastMonth = 11;
        lastYear = currentYear - 1;
      }
    }

    // FIXED: Use filtered users instead of all users
    const thisMonthUsers = filteredUsers.filter(user => {
      const date = convertToDate(user.createdAt);
      return date && date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear;
    }).length;

    const lastMonthUsers = filteredUsers.filter(user => {
      const date = convertToDate(user.createdAt);
      return date && date.getMonth() === lastMonth &&
        date.getFullYear() === lastYear;
    }).length;

    const userGrowth = lastMonthUsers ?
      ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

    // FIXED: Use filtered organizations
    const newOrgs = filteredOrgs.filter(org => {
      const date = convertToDate(org.createdAt);
      return date && date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear;
    }).length;

    const thisMonthHours = getCurrentMonthHours(filteredHours);
    const lastMonthHours = filteredHours.reduce((sum, hour) => {
      const date = convertToDate(hour.volDate || hour.date || hour.createdAt);
      if (date && date.getMonth() === lastMonth &&
        date.getFullYear() === lastYear) {
        return sum + (parseFloat(hour.hours) || 0);
      }
      return sum;
    }, 0);

    const activityGrowth = lastMonthHours ?
      ((thisMonthHours - lastMonthHours) / lastMonthHours) * 100 : 0;

    return {
      userGrowth: Math.round(userGrowth),
      newOrgs,
      activityGrowth: Math.round(activityGrowth),
      currentMonth: months.find(m => m.value === (currentMonth + 1).toString())?.label || 'נוכחי',
      lastMonth: months.find(m => m.value === (lastMonth + 1).toString())?.label || 'קודם'
    };
  }, [filteredUsers, filteredHours, filteredOrgs, convertToDate, selectedYear, selectedMonth, getCurrentMonthHours, months]);

  const lastUpdateDate = useMemo(() => new Date(), []);

  if (isLoading || !dataReady) {
    return (
      <div className="dashboard-container dashboard-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>טוען את לוח הבקרה...</h2>
          <p>אנא המתן בזמן שאנו מאחזרים את הנתונים</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-inner">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            לוח הבקרה לניתוח נתונים{getFilterContext()}
          </h1>
          <p className="dashboard-subtitle">
            מעקב אחר ביצועי פלטפורמת ניהול המתנדבים שלך
          </p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-header">
            <Filter className="filter-icon" />
            <h3 className="filter-title">מסנני נתונים</h3>
          </div>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">שנה</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select"
              >
                {availableYears.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">חודש</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="filter-select"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">תפקיד</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="filter-select"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">ארגון</label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="filter-select"
              >
                {orgOptions.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">עיר</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="filter-select"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="overview-grid">
          {[
            { label: `סך המשתמשים${getFilterContext()}`, value: overviewMetrics.totalUsers, Icon: Users, cardClass: 'card-bg-blue', iconClass: 'icon-gradient-blue' },
            { label: `ארגונים${getFilterContext()}`, value: overviewMetrics.totalOrgs, Icon: Building2, cardClass: 'card-bg-green', iconClass: 'icon-gradient-green' },
            { label: `סך כל השעות${getFilterContext()}`, value: overviewMetrics.totalHours.toFixed(1), Icon: Clock, cardClass: 'card-bg-amber', iconClass: 'icon-gradient-amber' },
            { label: `מתנדבים פעילים${getFilterContext()}`, value: overviewMetrics.activeVolunteers, Icon: TrendingUp, cardClass: 'card-bg-red', iconClass: 'icon-gradient-red' },
            { label: `ממוצע שעות למתנדב${getFilterContext()}`, value: overviewMetrics.avgHoursPerVolunteer, Icon: BarChart3, cardClass: 'card-bg-purple', iconClass: 'icon-gradient-purple' }
          ].map((item, idx) => (
            <div key={idx} className={`overview-card ${item.cardClass}`}>
              <div className="overview-card-content">
                <div className="overview-info">
                  <p className="overview-label">{item.label}</p>
                  <p className="overview-value">{item.value}</p>
                </div>
                <div className={`overview-icon-wrapper ${item.iconClass}`}>
                  <item.Icon className="overview-icon" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights Section */}
        <div className="insights-container">
          {/* Quick Stats Card */}
          <div className="stat-card bg-gradient-blue">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <Eye className="stat-icon" />
              </div>
              <h3 className="stat-title">סטטיסטיקות {getFilterContext()}</h3>
            </div>
            <div className="stat-content">
              <div className="stat-row">
                <span className="stat-label">אחוז מתנדבים פעילים</span>
                <span className="stat-value">{activeVolunteersPercentage}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">ממוצע ארגונים לעיר</span>
                <span className="stat-value">
                  {cities.length > 1 ? Math.round(overviewMetrics.totalOrgs / (cities.length - 1)) : 0}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">
                  {selectedYear !== 'all' && selectedMonth !== 'all' ?
                    `שעות ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}` :
                    'שעות החודש הנוכחי'}
                </span>
                <span className="stat-value">
                  {getCurrentMonthHours(filteredHours).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Growth Trends Card */}
          <div className="stat-card bg-gradient-green">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <TrendingUp className="stat-icon" />
              </div>
              <h3 className="stat-title">
                מגמות צמיחה
                {selectedYear !== 'all' && selectedMonth !== 'all'
                  ? ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                  : selectedYear !== 'all'
                    ? ` - שנת ${selectedYear}`
                    : selectedMonth !== 'all'
                      ? ` - ${months.find(m => m.value === selectedMonth)?.label}`
                      : ''
                }
              </h3>
            </div>
            <div className="stat-content">
              <div className="stat-row">
                <span className="stat-label">
                  צמיחה חודשית
                  {selectedYear !== 'all' && selectedMonth !== 'all'
                    ? ` (${months.find(m => m.value === selectedMonth)?.label} ${selectedYear})`
                    : ''
                  }
                </span>
                <span className="stat-value highlight">
                  {calculateGrowthMetrics.userGrowth > 0 ? '+' : ''}{calculateGrowthMetrics.userGrowth}%
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">
                  ארגונים חדשים
                  {selectedYear !== 'all' && selectedMonth !== 'all'
                    ? ` ב${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : selectedYear !== 'all'
                      ? ` בשנת ${selectedYear}`
                      : selectedMonth !== 'all'
                        ? ` ב${months.find(m => m.value === selectedMonth)?.label}`
                        : ''
                  }
                </span>
                <span className="stat-value">+{calculateGrowthMetrics.newOrgs}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">
                  שיפור בפעילות
                  {selectedYear !== 'all' && selectedMonth !== 'all'
                    ? ` (${months.find(m => m.value === selectedMonth)?.label} ${selectedYear})`
                    : ''
                  }
                </span>
                <span className="stat-value highlight">
                  {calculateGrowthMetrics.activityGrowth > 0 ? '+' : ''}{calculateGrowthMetrics.activityGrowth}%
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Goals Card */}
          <div className="stat-card bg-gradient-orange">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <Calendar className="stat-icon" />
              </div>
              <h3 className="stat-title">
                יעדי
                {selectedYear !== 'all' && selectedMonth !== 'all'
                  ? ` ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                  : selectedMonth !== 'all'
                    ? ` ${months.find(m => m.value === selectedMonth)?.label}`
                    : selectedYear !== 'all'
                      ? ` שנת ${selectedYear}`
                      : ' החודש הנוכחי'
                }
              </h3>
            </div>
            <div className="stat-content">
              <div className="stat-row">
                <span className="stat-label">
                  יעד שעות
                  {selectedYear !== 'all' && selectedMonth !== 'all'
                    ? ` ל${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : selectedMonth !== 'all'
                      ? ` ל${months.find(m => m.value === selectedMonth)?.label}`
                      : ''
                  }
                </span>
                {isEditingGoal ? (
                  <div className="goal-edit-container">
                    <input
                      type="number"
                      value={monthlyGoal}
                      onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                      className="goal-input"
                    />
                    <button
                      onClick={() => setIsEditingGoal(false)}
                      className="goal-save-btn"
                    >
                      שמור
                    </button>
                  </div>
                ) : (
                  <div className="goal-display">
                    <span className="stat-value">{monthlyGoal} שעות</span>
                    <button
                      onClick={() => setIsEditingGoal(true)}
                      className="goal-edit-btn"
                    >
                      ערוך
                    </button>
                  </div>
                )}
              </div>
              <div className="stat-row">
                <span className="stat-label">
                  השגה
                  {selectedYear !== 'all' && selectedMonth !== 'all'
                    ? ` ב${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : selectedMonth !== 'all'
                      ? ` ב${months.find(m => m.value === selectedMonth)?.label}`
                      : ' נוכחית '
                  }
                </span>
                <span className="stat-value highlight">
                  {Math.round((getCurrentMonthHours(filteredHours) / monthlyGoal) * 100)}%
                </span>
              </div>
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.min((getCurrentMonthHours(filteredHours) / monthlyGoal) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Accordion Section */}
        <div className="charts-accordion">
          <div className="accordion-header">
            <h2 className="section-title">דוחות וגרפים מפורטים</h2>
            <p className="section-subtitle">לחץ על דו"ח כלשהו כדי להציג את הנתונים</p>
          </div>

          {/* User Growth Chart */}
          <div className="accordion-item">
            <button
              className={`accordion-toggle ${expandedChart === 'userGrowth' ? 'active' : ''}`}
              onClick={() => toggleChart('userGrowth')}
            >
              <div className="accordion-toggle-content">
                <div className="accordion-icon-title">
                  <div className="chart-icon-container chart-icon-blue">
                    <TrendingUp className="chart-icon" />
                  </div>
                  <h3 className="accordion-title">
                    משתמשים חדשים לפי זמן
                    {selectedYear !== 'all' && selectedMonth !== 'all'
                      ? ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                      : selectedYear !== 'all'
                        ? ` - שנת ${selectedYear}`
                        : selectedMonth !== 'all'
                          ? ` - ${months.find(m => m.value === selectedMonth)?.label}`
                          : selectedRole !== 'all'
                            ? ` - ${roles.find(r => r.value === selectedRole)?.label}`
                            : selectedOrg !== 'all'
                              ? ` - ${orgOptions.find(o => o.id === selectedOrg)?.name}`
                              : ''
                    }
                  </h3>
                </div>
                <div className={`accordion-arrow ${expandedChart === 'userGrowth' ? 'expanded' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </button>
            <div className={`accordion-content ${expandedChart === 'userGrowth' ? 'expanded' : ''}`}>
              <div className="chart-container">
                <ResponsiveContainer>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="userGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#4B5563' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('he-IL', { month: 'short' })}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#4B5563' }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="chart-tooltip">
                              <p className="chart-tooltip-label">
                                {new Date(payload[0].payload.date).toLocaleDateString('he-IL', {
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="chart-tooltip-value">
                                {payload[0].value.toLocaleString()} משתמשים חדשים
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3B82F6"
                      fill="url(#userGrowth)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Role Distribution Chart */}
          <div className="accordion-item">
            <button
              className={`accordion-toggle ${expandedChart === 'roleDistribution' ? 'active' : ''}`}
              onClick={() => toggleChart('roleDistribution')}
            >
              <div className="accordion-toggle-content">
                <div className="accordion-icon-title">
                  <div className="chart-icon-container chart-icon-purple">
                    <Circle className="chart-icon" />
                  </div>
                  <h3 className="accordion-title">
                    התפלגות תפקידים
                    {selectedYear !== 'all' && selectedMonth !== 'all'
                      ? ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                      : selectedYear !== 'all'
                        ? ` - שנת ${selectedYear}`
                        : selectedMonth !== 'all'
                          ? ` - ${months.find(m => m.value === selectedMonth)?.label}`
                          : selectedOrg !== 'all'
                            ? ` - ${orgOptions.find(o => o.id === selectedOrg)?.name}`
                            : selectedCity !== 'הכל'
                              ? ` - ${selectedCity}`
                              : ''
                    }
                  </h3>
                </div>
                <div className={`accordion-arrow ${expandedChart === 'roleDistribution' ? 'expanded' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </button>
            <div className={`accordion-content ${expandedChart === 'roleDistribution' ? 'expanded' : ''}`}>
              <div className="chart-container" style={{ display: 'flex', flexDirection: 'row' }}>
                <ResponsiveContainer width="70%" height="100%">
                  <PieChart>
                    <defs>
                      {COLORS.map((color, index) => (
                        <linearGradient key={index} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const { name, value, percent } = payload[0].payload;
                          return (
                            <div className="chart-tooltip">
                              <p className="chart-tooltip-label">{name}</p>
                              <p className="chart-tooltip-value">
                                {value} ({(percent * 100).toFixed(0)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={roleDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#gradient${index})`} />))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="legend-container">
                  {roleDistribution.map((role, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.875rem',
                      color: '#4B5563',
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: COLORS[index],
                      }} />
                      <span>{role.name} ({(role.percent * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Organizations Chart */}
          <div className="accordion-item">
            <button
              className={`accordion-toggle ${expandedChart === 'topOrgs' ? 'active' : ''}`}
              onClick={() => toggleChart('topOrgs')}
            >
              <div className="accordion-toggle-content">
                <div className="accordion-icon-title">
                  <div className="chart-icon-container chart-icon-red">
                    <Building2 className="chart-icon" />
                  </div>
                  <h3 className="accordion-title">
                    ארגונים מובילים לפי שעות
                    {selectedYear !== 'all' && selectedMonth !== 'all'
                      ? ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                      : selectedYear !== 'all'
                        ? ` - שנת ${selectedYear}`
                        : selectedMonth !== 'all'
                          ? ` - ${months.find(m => m.value === selectedMonth)?.label}`
                          : selectedCity !== 'הכל'
                            ? ` - ${selectedCity}`
                            : ''
                    }
                  </h3>
                </div>
                <div className={`accordion-arrow ${expandedChart === 'topOrgs' ? 'expanded' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </button>
            <div className={`accordion-content ${expandedChart === 'topOrgs' ? 'expanded' : ''}`}>
              <div className="chart-container">
                <ResponsiveContainer>
                  <BarChart
                    data={topOrgsByHours}
                    layout="vertical"
                    margin={{ top: 20, right: 20, left: 160, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#374151' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      tick={{
                        fontSize: 11,
                        fill: '#374151',
                        textAnchor: 'end',
                      }}
                      orientation="right"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          return (
                            <div className="chart-tooltip">
                              <p className="chart-tooltip-label">{payload[0].payload.name}</p>
                              <p className="chart-tooltip-value">
                                {payload[0].value.toLocaleString()} שעות
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="#EF4444"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Hours Tracking Chart */}
          <div className="accordion-item">
            <button
              className={`accordion-toggle ${expandedChart === 'hoursTracking' ? 'active' : ''}`}
              onClick={() => toggleChart('hoursTracking')}
            >
              <div className="accordion-toggle-content">
                <div className="accordion-icon-title">
                  <div className="chart-icon-container chart-icon-green">
                    <Clock className="chart-icon" />
                  </div>
                  <h3 className="accordion-title">
                    כמות שעות התנדבות לפי זמן
                    {selectedYear !== 'all' && selectedMonth !== 'all'
                      ? ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                      : selectedYear !== 'all'
                        ? ` - שנת ${selectedYear}`
                        : selectedMonth !== 'all'
                          ? ` - ${months.find(m => m.value === selectedMonth)?.label}`
                          : selectedRole !== 'all'
                            ? ` - ${roles.find(r => r.value === selectedRole)?.label}`
                            : selectedOrg !== 'all'
                              ? ` - ${orgOptions.find(o => o.id === selectedOrg)?.name}`
                              : ''
                    }
                  </h3>
                </div>
                <div className={`accordion-arrow ${expandedChart === 'hoursTracking' ? 'expanded' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </button>
            <div className={`accordion-content ${expandedChart === 'hoursTracking' ? 'expanded' : ''}`}>
              <div className="chart-container">
                <ResponsiveContainer>
                  <AreaChart data={hoursData}>
                    <defs>
                      <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('he-IL', { month: 'short' })}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="chart-tooltip">
                              <p className="chart-tooltip-label">
                                {new Date(payload[0].payload.date).toLocaleDateString('he-IL', {
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="chart-tooltip-value">
                                {payload[0].value.toLocaleString()} שעות התנדבות
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#10B981"
                      fill="url(#hoursGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Volunteers Chart */}
          <div className="accordion-item">
            <button
              className={`accordion-toggle ${expandedChart === 'topVolunteers' ? 'active' : ''}`}
              onClick={() => toggleChart('topVolunteers')}
            >
              <div className="accordion-toggle-content">
                <div className="accordion-icon-title">
                  <div className="chart-icon-container chart-icon-orange">
                    <Users className="chart-icon" />
                  </div>
                  <h3 className="accordion-title">
                    מתנדבים מובילים לפי שעות
                    {selectedYear !== 'all' && selectedMonth !== 'all'
                      ? ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                      : selectedYear !== 'all'
                        ? ` - שנת ${selectedYear}`
                        : selectedMonth !== 'all'
                          ? ` - ${months.find(m => m.value === selectedMonth)?.label}`
                          : selectedOrg !== 'all'
                            ? ` - ${orgOptions.find(o => o.id === selectedOrg)?.name}`
                            : selectedCity !== 'הכל'
                              ? ` - ${selectedCity}`
                              : ''
                    }
                  </h3>
                </div>
                <div className={`accordion-arrow ${expandedChart === 'topVolunteers' ? 'expanded' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </button>
            <div className={`accordion-content ${expandedChart === 'topVolunteers' ? 'expanded' : ''}`}>
              <div className="chart-container">
                <ResponsiveContainer>
                  <BarChart
                    data={topVolunteers}
                    layout="vertical"
                    margin={{ top: 20, right: 20, left: 160, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#374151' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      tick={{
                        fontSize: 11,
                        fill: '#374151',
                        textAnchor: 'end',
                      }}
                      orientation="right"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          return (
                            <div className="chart-tooltip">
                              <p className="chart-tooltip-label">{payload[0].payload.name}</p>
                              <p className="chart-tooltip-value">
                                {payload[0].value.toLocaleString()} שעות
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="#F97316"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations Distribution */}
        <div className="city-distribution">
          <h3 className="section-title">
            התפלגות ארגונים לפי ערים
            {selectedYear !== 'all' && selectedMonth !== 'all'
              ? ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
              : selectedYear !== 'all'
                ? ` - שנת ${selectedYear}`
                : selectedMonth !== 'all'
                  ? ` - ${months.find(m => m.value === selectedMonth)?.label}`
                  : ''
            }
          </h3>
          <div className="city-grid">
            {cities.filter(city => city !== 'הכל').map((city, index) => {
              const cityOrgs = filteredOrgs.filter(org =>
                (org.city || org.City || '').toLowerCase() === city.toLowerCase()
              );

              const cityHours = filteredHours.reduce((sum, hour) => {
                const org = organizations.find(o =>
                  String(o.id) === String(hour.orgId) ||
                  String(o.Id) === String(hour.orgId)
                );

                if (org && (org.city || org.City || '').toLowerCase() === city.toLowerCase()) {
                  return sum + (parseFloat(hour.hours) || 0);
                }
                return sum;
              }, 0);

              return (
                <div key={city} className="city-card">
                  <div className="city-card-header">
                    <h4 className="city-name">{city}</h4>
                    <span className="city-org-count">{cityOrgs.length} ארגונים</span>
                  </div>
                  <div className="city-hours">{cityHours.toFixed(1)}</div>
                  <div className="city-hours-label">שעות התנדבות</div>
                  <div className="progress-bg">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min((cityHours / Math.max(...cities
                          .filter(c => c !== 'הכל')
                          .map(c => filteredHours
                            .reduce((sum, hour) => {
                              const org = organizations.find(o =>
                                String(o.id) === String(hour.orgId) ||
                                String(o.Id) === String(hour.orgId)
                              );
                              if (org && (org.city || org.City || '').toLowerCase() === c.toLowerCase()) {
                                return sum + (parseFloat(hour.hours) || 0);
                              }
                              return sum;
                            }, 0)
                          ), 1)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <div className="footer-content">
            <p className="footer-text">
              מערכת ניהול מתנדבים
            </p>
            <p className="footer-update">
              עודכן לאחרונה: {lastUpdateDate.toLocaleString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="footer-subtext">
              {new Date().getFullYear()} © כל הזכויות שמורות
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardAnalytics;
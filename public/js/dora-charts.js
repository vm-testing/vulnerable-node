(function() {
  'use strict';

  var currentDays = 90;
  var charts = {};

  function ratingColor(rating) {
    var colors = {
      Elite: '#5cb85c',
      High: '#5bc0de',
      Medium: '#f0ad4e',
      Low: '#d9534f'
    };
    return colors[rating] || '#999';
  }

  function ratingClass(rating) {
    return 'rating-' + (rating || 'low').toLowerCase();
  }

  function showLoading() {
    $('#dora-metrics-content').hide();
    $('#dora-error').hide();
    $('#dora-loading').show();
  }

  function showError(message) {
    $('#dora-loading').hide();
    $('#dora-metrics-content').hide();
    $('#dora-error').show().find('.error-message').text(message);
  }

  function showContent() {
    $('#dora-loading').hide();
    $('#dora-error').hide();
    $('#dora-metrics-content').show();
  }

  function updateMetricCard(id, metric) {
    var $card = $('#' + id);
    $card.find('.metric-value').text(formatMetricValue(id, metric));
    $card.find('.metric-description').text(metric.description);

    var $badge = $card.find('.rating-badge');
    $badge.text(metric.rating)
      .removeClass('rating-elite rating-high rating-medium rating-low')
      .addClass(ratingClass(metric.rating));
  }

  function formatMetricValue(id, metric) {
    switch (id) {
      case 'deployment-frequency':
        return metric.weeklyRate + '/week';
      case 'lead-time':
        if (metric.medianLeadTimeHours < 1) {
          return Math.round(metric.medianLeadTimeHours * 60) + ' min';
        }
        if (metric.medianLeadTimeHours < 24) {
          return metric.medianLeadTimeHours + ' hrs';
        }
        return Math.round(metric.medianLeadTimeHours / 24 * 10) / 10 + ' days';
      case 'change-failure-rate':
        return metric.failureRate + '%';
      case 'mttr':
        if (metric.incidentCount === 0) return 'N/A';
        if (metric.medianRecoveryHours < 1) {
          return Math.round(metric.medianRecoveryHours * 60) + ' min';
        }
        if (metric.medianRecoveryHours < 24) {
          return metric.medianRecoveryHours + ' hrs';
        }
        return Math.round(metric.medianRecoveryHours / 24 * 10) / 10 + ' days';
      default:
        return '-';
    }
  }

  function renderCharts(data) {
    var metrics = data.metrics;

    // Destroy existing charts
    Object.keys(charts).forEach(function(key) {
      if (charts[key]) charts[key].destroy();
    });

    // Deployment Frequency - Bar chart
    var dfCtx = document.getElementById('chart-deployment-frequency').getContext('2d');
    charts.df = new Chart(dfCtx, {
      type: 'bar',
      data: {
        labels: ['Daily Rate', 'Weekly Rate'],
        datasets: [{
          label: 'Deployment Frequency',
          data: [metrics.deploymentFrequency.dailyRate, metrics.deploymentFrequency.weeklyRate],
          backgroundColor: [ratingColor(metrics.deploymentFrequency.rating), ratingColor(metrics.deploymentFrequency.rating) + 'aa'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Lead Time - Bar chart (horizontal)
    var ltCtx = document.getElementById('chart-lead-time').getContext('2d');
    charts.lt = new Chart(ltCtx, {
      type: 'bar',
      data: {
        labels: ['Median Lead Time (hours)'],
        datasets: [{
          label: 'Lead Time',
          data: [metrics.leadTime.medianLeadTimeHours],
          backgroundColor: [ratingColor(metrics.leadTime.rating)],
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, title: { display: true, text: 'Hours' } } }
      }
    });

    // Change Failure Rate - Doughnut
    var cfrCtx = document.getElementById('chart-change-failure-rate').getContext('2d');
    var failRate = metrics.changeFailureRate.failureRate;
    charts.cfr = new Chart(cfrCtx, {
      type: 'doughnut',
      data: {
        labels: ['Failures', 'Successful'],
        datasets: [{
          data: [failRate, 100 - failRate],
          backgroundColor: [ratingColor(metrics.changeFailureRate.rating), '#e8e8e8'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // MTTR - Bar chart
    var mttrCtx = document.getElementById('chart-mttr').getContext('2d');
    charts.mttr = new Chart(mttrCtx, {
      type: 'bar',
      data: {
        labels: ['Median Recovery Time (hours)'],
        datasets: [{
          label: 'MTTR',
          data: [metrics.mttr.medianRecoveryHours],
          backgroundColor: [ratingColor(metrics.mttr.rating)],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours' } } }
      }
    });
  }

  function fetchMetrics(days) {
    showLoading();
    $.ajax({
      url: '/api/dora/metrics?days=' + days,
      method: 'GET',
      dataType: 'json'
    }).done(function(data) {
      updateMetricCard('deployment-frequency', data.metrics.deploymentFrequency);
      updateMetricCard('lead-time', data.metrics.leadTime);
      updateMetricCard('change-failure-rate', data.metrics.changeFailureRate);
      updateMetricCard('mttr', data.metrics.mttr);
      renderCharts(data);

      var generated = new Date(data.generatedAt);
      $('#dora-generated-at').text('Generated: ' + generated.toLocaleString());
      $('#dora-period-info').text('Period: ' + data.period.days + ' days');

      showContent();
    }).fail(function(xhr) {
      var msg = 'Failed to load metrics';
      if (xhr.responseJSON && xhr.responseJSON.message) {
        msg += ': ' + xhr.responseJSON.message;
      }
      showError(msg);
    });
  }

  $(document).ready(function() {
    // Period selector
    $('.period-btn').on('click', function() {
      $('.period-btn').removeClass('active');
      $(this).addClass('active');
      currentDays = parseInt($(this).data('days'));
      fetchMetrics(currentDays);
    });

    // Initial load
    fetchMetrics(currentDays);
  });
})();

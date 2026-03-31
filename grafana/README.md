# Grafana - DORA Metrics Visualization

Professional visualization layer for the DORA metrics API using Grafana with the Infinity datasource plugin.

## Architecture

```
Express App (:3000)          Grafana (:3001)
  /api/dora/metrics  <----   Infinity Plugin (JSON datasource)
                              |
                              v
                         DORA Dashboard
                         (5 panels, pre-provisioned)
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Express app running on port 3000 (`npm start`)

### Launch Grafana

```bash
cd grafana
docker compose -f docker-compose.grafana.yml up -d
```

### Access

- **URL**: http://localhost:3001
- **Username**: admin
- **Password**: admin

The DORA Metrics dashboard is pre-provisioned and set as the home dashboard.

## Dashboard Panels

| Panel | Type | Metric |
|-------|------|--------|
| Deployment Frequency | Stat | Weekly deploy rate |
| Lead Time for Changes | Stat | Median hours from commit to deploy |
| Change Failure Rate | Stat | % of deployments causing failures |
| Mean Time to Recovery | Stat | Median hours to recover from failure |
| Rating Summary | Table | DORA ratings for all 4 metrics |

### Color Coding (DORA Ratings)

| Color | Rating | Performance Level |
|-------|--------|-------------------|
| Green | Elite | Top performers |
| Blue | High | High performers |
| Yellow | Medium | Medium performers |
| Red | Low | Low performers |

## Configuration

### Changing the API URL

If your Express app runs on a different host/port, update the panel queries in `provisioning/dashboards/dora-metrics.json`:

```
http://host.docker.internal:3000/api/dora/metrics?days=90
```

- `host.docker.internal` resolves to the Docker host machine
- On Linux, you may need to use `--add-host=host.docker.internal:host-gateway` or your machine's IP

### Stopping Grafana

```bash
cd grafana
docker compose -f docker-compose.grafana.yml down
```

To remove all data (reset):

```bash
docker compose -f docker-compose.grafana.yml down -v
```

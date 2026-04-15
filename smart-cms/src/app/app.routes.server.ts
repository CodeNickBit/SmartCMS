import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'projects/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'projects/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'tasks/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'projects/:id/workload',
    renderMode: RenderMode.Client
  },
  {
    path: 'timesheets/:employeeId',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];

import { Outlet } from 'react-router-dom'

export function BlankLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}

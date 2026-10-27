import { Routes, Route } from "react-router";
import Background from "./components/background";
import MainPage from "./pages/main/page";
import AuthPage from "./pages/auth/page";
import NotFoundPage from "./pages/error/404";
import ErrorPage from "./pages/error/500";

function App() {
	return (
		<div className="relative min-h-dvh">
			<Background />
			<main className="relative z-10 flex w-screen h-dvh p-[64px] flex-col items-center justify-center gap-4">
				<Routes>
					<Route path="/" element={<MainPage/>}/>
					<Route path="/login" element={<AuthPage />}/>
					<Route path="/error" element={<ErrorPage />}/>
					<Route path="*" element={<NotFoundPage />}/>
				</Routes>
			</main>
		</div>
	);
}

export default App;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DishCard from '../../components/DishCard/DishCard';
import dishesService from '../../services/dishesService';
import './Home.css';

function Home() {
  const [dish, setDish] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadDish() {
      try {
        const result = await dishesService.getFeaturedDish();

        if (isActive) {
          setDish(result);
        }
      } catch {
        if (isActive) {
          setError('Не вдалося завантажити страву.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDish();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero__content">
          <span className="home-hero__label">
            Твій смак — наш орієнтир
          </span>

          <h1 className="home-hero__title">
            Знаємо, де
            <br />
            <span>тобі буде смачно.</span>
          </h1>

          <p className="home-hero__description">
            Улюблені смаки, нові страви та заклади, які варто спробувати.
            SmartMenu допоможе обрати на основі твоїх уподобань
            і відгуків людей зі схожим смаком.
          </p>

          <Link to="/restaurants" className="home-hero__button">
            Відкрити смачні місця <span aria-hidden="true">↗</span>
          </Link>

          <p className="home-hero__note">
            Уже в закладі? Скануй QR-код, щоб одразу відкрити його меню.
          </p>
        </div>

        <div className="home-featured" aria-busy={isLoading}>
          <p className="home-featured__label">
            Можливо, твоя нова улюблена
          </p>

          {isLoading ? (
            <div className="home-featured__message" role="status">
              Завантажуємо щось смачне…
            </div>
          ) : error ? (
            <div className="home-featured__message" role="alert">
              {error}
            </div>
          ) : dish ? (
            <DishCard dish={dish} />
          ) : (
            <div className="home-featured__message">
              Незабаром тут з’явиться щось смачне.
            </div>
          )}
        </div>
      </section>

      <section className="home-steps" aria-labelledby="home-steps-title">
        <div className="home-steps__heading">
          <span className="home-hero__label">
            Смачно — у кожного своє
          </span>

          <h2 id="home-steps-title">
            Рекомендації починаються з тебе
          </h2>
        </div>

        <div className="home-steps__grid">
          <article className="home-step">
            <span className="home-step__number">01</span>
            <h3>Поділися своїми смаками</h3>
            <p>
              Розкажи про улюблені кухні та смакові вподобання.
              Оцінюй страви, щоб SmartMenu краще розумів,
              що тобі подобається.
            </p>
          </article>

          <article className="home-step">
            <span className="home-step__number">02</span>
            <h3>Довіряй близьким за смаком</h3>
            <p>
              Орієнтуйся на відгуки людей зі схожими вподобаннями:
              їхній досвід допоможе обрати те, що сподобається й тобі.
            </p>
          </article>

          <article className="home-step">
            <span className="home-step__number">03</span>
            <h3>Відкривай своє смачне</h3>
            <p>
              Знайомся зі стравами та закладами, підібраними під твій смак.
              Можливо, наступна рекомендація стане твоїм улюбленим місцем.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Home;
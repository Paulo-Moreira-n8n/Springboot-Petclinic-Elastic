package org.springframework.samples.petclinic.repository.springdatajpa;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.context.annotation.Profile;
import org.springframework.samples.petclinic.model.Visit;
import org.springframework.transaction.annotation.Transactional;

@Profile("spring-data-jpa")
public class SpringDataVisitRepositoryImpl implements VisitRepositoryOverride {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    @Override
    public void delete(Visit visit) {
        Integer visitId = visit.getId();

        em.createQuery("DELETE FROM Visit v WHERE v.id = :id")
          .setParameter("id", visitId)
          .executeUpdate();

        em.flush();
        em.clear();
    }
}

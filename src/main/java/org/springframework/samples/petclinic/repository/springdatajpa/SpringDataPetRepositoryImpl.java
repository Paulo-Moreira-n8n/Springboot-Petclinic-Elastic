package org.springframework.samples.petclinic.repository.springdatajpa;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.context.annotation.Profile;
import org.springframework.samples.petclinic.model.Pet;
import org.springframework.transaction.annotation.Transactional;

@Profile("spring-data-jpa")
public class SpringDataPetRepositoryImpl implements PetRepositoryOverride {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    @Override
    public void delete(Pet pet) {
        Integer petId = pet.getId();

        // 1) Apaga visitas do pet
        em.createQuery("DELETE FROM Visit v WHERE v.pet.id = :petId")
          .setParameter("petId", petId)
          .executeUpdate();

        // 2) Apaga o próprio pet
        em.createQuery("DELETE FROM Pet p WHERE p.id = :petId")
          .setParameter("petId", petId)
          .executeUpdate();

        // 3) Garante que o 1º nível de cache não devolva entidade obsoleta
        em.flush();
        em.clear();
    }
}
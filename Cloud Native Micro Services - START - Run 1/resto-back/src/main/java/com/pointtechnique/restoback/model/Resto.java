package com.pointtechnique.restoback.model;

import java.time.LocalDateTime;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;

import com.fasterxml.jackson.annotation.JsonIgnore;

import org.hibernate.annotations.CreationTimestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="RESTOS")
public class Resto {
    private @Id @GeneratedValue Long id;
    private String name;
    private String location;
    @CreationTimestamp
    private LocalDateTime createdAt;
    private @Version @JsonIgnore Long version;
}